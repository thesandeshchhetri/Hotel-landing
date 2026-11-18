-- Safe OTP resend support. This migration intentionally preserves existing bookings.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS otp_resend_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_resend_window_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS otp_last_sent_at timestamptz;

-- Renew an OTP only for the matching pending booking and guest email.
-- Limits: 60-second cooldown and at most 5 resends per rolling hour.
CREATE OR REPLACE FUNCTION public.resend_booking_otp(
  p_booking_id uuid,
  p_guest_email text,
  p_otp_hash text,
  p_otp_expires_at timestamptz
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_window_started timestamptz;
  v_resend_count integer;
BEGIN
  IF p_booking_id IS NULL
     OR p_guest_email IS NULL
     OR p_otp_hash IS NULL OR length(p_otp_hash) <> 64
     OR p_otp_expires_at <= now()
     OR p_otp_expires_at > now() + interval '15 minutes'
  THEN
    RETURN 'unavailable';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND
     OR lower(trim(v_booking.guest_email)) <> lower(trim(p_guest_email))
     OR v_booking.status <> 'pending'
     OR v_booking.otp_verified = true
  THEN
    RETURN 'unavailable';
  END IF;

  IF v_booking.otp_last_sent_at IS NOT NULL
     AND v_booking.otp_last_sent_at > now() - interval '60 seconds'
  THEN
    RETURN 'cooldown';
  END IF;

  IF v_booking.otp_resend_window_started_at IS NULL
     OR v_booking.otp_resend_window_started_at <= now() - interval '1 hour'
  THEN
    v_window_started := now();
    v_resend_count := 1;
  ELSE
    IF v_booking.otp_resend_count >= 5 THEN
      RETURN 'limit';
    END IF;
    v_window_started := v_booking.otp_resend_window_started_at;
    v_resend_count := v_booking.otp_resend_count + 1;
  END IF;

  UPDATE public.bookings
  SET otp_hash = p_otp_hash,
      otp_code = '',
      otp_expires_at = p_otp_expires_at,
      otp_attempts = 0,
      otp_locked_until = NULL,
      otp_resend_count = v_resend_count,
      otp_resend_window_started_at = v_window_started,
      otp_last_sent_at = now(),
      updated_at = now()
  WHERE id = p_booking_id;

  RETURN 'sent';
END;
$$;

REVOKE ALL ON FUNCTION public.resend_booking_otp(uuid,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resend_booking_otp(uuid,text,text,timestamptz) TO service_role;

-- Do not cancel every customer's expired pending booking when someone starts a new booking.
-- Expired pending rows are already excluded from availability calculations.
CREATE OR REPLACE FUNCTION public.create_booking_with_otp(
  p_room_id uuid, p_guest_name text, p_guest_email text, p_guest_phone text,
  p_check_in date, p_check_out date, p_guests integer, p_special_requests text,
  p_otp_hash text, p_otp_expires_at timestamptz
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_conflicts integer;
  v_recent integer;
  v_id uuid;
BEGIN
  IF p_guest_name IS NULL OR length(trim(p_guest_name)) NOT BETWEEN 2 AND 120
     OR p_guest_email IS NULL OR length(p_guest_email) > 254
     OR p_guest_email !~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
     OR p_guest_phone IS NULL OR length(trim(p_guest_phone)) NOT BETWEEN 7 AND 30
     OR p_check_in < current_date OR p_check_out <= p_check_in
     OR p_guests < 1 OR p_guests > 20
     OR p_otp_hash IS NULL OR length(p_otp_hash) <> 64
     OR p_otp_expires_at <= now() OR p_otp_expires_at > now() + interval '15 minutes'
  THEN RAISE EXCEPTION 'Invalid booking details'; END IF;

  SELECT * INTO v_room FROM public.rooms
    WHERE id = p_room_id AND is_active = true FOR UPDATE;
  IF NOT FOUND OR p_guests > v_room.capacity THEN
    RAISE EXCEPTION 'Room unavailable or guest count exceeds capacity';
  END IF;

  SELECT count(*) INTO v_conflicts FROM public.bookings
    WHERE room_id = p_room_id
      AND (status = 'confirmed' OR (status = 'pending' AND otp_expires_at > now()))
      AND check_in_date < p_check_out AND check_out_date > p_check_in;
  IF v_conflicts >= v_room.total_inventory THEN
    RAISE EXCEPTION 'No rooms available for these dates';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(lower(trim(p_guest_email))));
  SELECT count(*) INTO v_recent FROM public.bookings
    WHERE lower(guest_email) = lower(trim(p_guest_email))
      AND created_at > now() - interval '1 hour';
  IF v_recent >= 5 THEN RAISE EXCEPTION 'Too many booking attempts'; END IF;

  INSERT INTO public.bookings (
    room_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date,
    number_of_guests, special_requests, total_amount, status, otp_code, otp_hash,
    otp_attempts, otp_expires_at
  ) VALUES (
    p_room_id, trim(p_guest_name), lower(trim(p_guest_email)), trim(p_guest_phone),
    p_check_in, p_check_out, p_guests, nullif(trim(p_special_requests), ''),
    v_room.price_per_night * (p_check_out - p_check_in), 'pending', '', p_otp_hash, 0, p_otp_expires_at
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_with_otp(uuid,text,text,text,date,date,integer,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_with_otp(uuid,text,text,text,date,date,integer,text,text,timestamptz) TO service_role;
