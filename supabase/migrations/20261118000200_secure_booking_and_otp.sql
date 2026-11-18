-- Private booking records and server-side booking/OTP workflow.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS otp_hash text,
  ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_locked_until timestamptz;

-- Legacy OTPs were plaintext and must never remain usable.
UPDATE public.bookings SET otp_code = '', otp_hash = NULL WHERE otp_code <> '';
UPDATE public.bookings
  SET status = 'cancelled', cancelled_at = now(), cancelled_reason = 'Legacy OTP verification retired', updated_at = now()
  WHERE status = 'pending' AND otp_verified = false;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;

CREATE POLICY "Admins can manage bookings"
  ON public.bookings FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

REVOKE ALL ON public.bookings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;

CREATE INDEX IF NOT EXISTS idx_bookings_email_created
  ON public.bookings (guest_email, created_at DESC);

CREATE OR REPLACE FUNCTION public.create_booking_with_otp(
  p_room_id uuid, p_guest_name text, p_guest_email text, p_guest_phone text,
  p_check_in date, p_check_out date, p_guests integer, p_special_requests text,
  p_otp_hash text, p_otp_expires_at timestamptz
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_conflicts integer;
  v_recent integer;
  v_id uuid;
BEGIN
  IF p_guest_name IS NULL OR length(trim(p_guest_name)) NOT BETWEEN 2 AND 120
     OR p_guest_email IS NULL OR length(p_guest_email) > 254
     OR p_guest_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
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
    WHERE room_id = p_room_id AND status IN ('pending','confirmed')
      AND check_in_date < p_check_out AND check_out_date > p_check_in;
  IF v_conflicts >= v_room.total_inventory THEN
    RAISE EXCEPTION 'No rooms available for these dates';
  END IF;

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

CREATE OR REPLACE FUNCTION public.verify_booking_otp(p_booking_id uuid, p_otp_hash text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_booking public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND OR v_booking.otp_verified OR v_booking.status <> 'pending'
     OR v_booking.otp_expires_at <= now()
     OR v_booking.otp_attempts >= 5
     OR (v_booking.otp_locked_until IS NOT NULL AND v_booking.otp_locked_until > now())
  THEN RETURN false; END IF;

  IF v_booking.otp_hash IS NULL OR v_booking.otp_hash <> p_otp_hash THEN
    UPDATE public.bookings
      SET otp_attempts = otp_attempts + 1,
          otp_locked_until = CASE WHEN otp_attempts + 1 >= 5
            THEN now() + interval '15 minutes' ELSE otp_locked_until END,
          updated_at = now()
      WHERE id = p_booking_id;
    RETURN false;
  END IF;

  UPDATE public.bookings SET otp_verified = true, otp_hash = NULL, otp_code = '',
    verified_at = now(), status = 'confirmed', confirmed_at = now(), updated_at = now()
    WHERE id = p_booking_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_with_otp(uuid,text,text,text,date,date,integer,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_booking_otp(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_with_otp(uuid,text,text,text,date,date,integer,text,text,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_booking_otp(uuid,text) TO service_role;
