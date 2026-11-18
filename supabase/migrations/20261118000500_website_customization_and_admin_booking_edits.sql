-- Website-wide settings, media storage reuse, booking editing and confirmation email tracking.
-- Apply this migration in Supabase SQL Editor after reviewing it. Do not run db push
-- until the existing remote migration history has been reconciled.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

GRANT SELECT ON public.bookings TO service_role;
GRANT SELECT ON public.rooms TO service_role;
GRANT SELECT ON public.hotel_info TO service_role;
GRANT UPDATE (confirmation_email_sent_at) ON public.bookings TO service_role;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  theme jsonb NOT NULL DEFAULT '{"primary":"#d97706","secondary":"#1f2937","accent":"#f59e0b","background":"#f9fafb","text":"#111827"}'::jsonb,
  page_images jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view website settings" ON public.site_settings;
CREATE POLICY "Public can view website settings"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update website settings" ON public.site_settings;
CREATE POLICY "Admins can update website settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;

INSERT INTO public.site_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_update_booking(
  p_booking_id uuid,
  p_room_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_special_requests text,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_current public.bookings%ROWTYPE;
  v_reserved integer;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  SELECT * INTO v_current
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF p_guest_name IS NULL OR length(trim(p_guest_name)) = 0
     OR p_guest_email IS NULL OR p_guest_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+
    RAISE EXCEPTION 'Guest name, email and phone are required';
  END IF;

  IF p_check_in IS NULL OR p_check_out IS NULL
     OR p_check_out <= p_check_in
     OR (p_status IN ('pending', 'confirmed') AND p_check_in < current_date
         AND (p_check_in <> v_current.check_in_date OR p_check_out <> v_current.check_out_date)) THEN
    RAISE EXCEPTION 'Choose valid future check-in and check-out dates';
  END IF;

  IF p_guests IS NULL OR p_guests < 1 THEN
    RAISE EXCEPTION 'Guest count must be at least one';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('pending', 'confirmed', 'cancelled', 'completed') THEN
    RAISE EXCEPTION 'Invalid booking status';
  END IF;

  IF p_status = 'confirmed' AND NOT v_current.otp_verified THEN
    RAISE EXCEPTION 'Guest email must be verified before confirming this booking';
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = p_room_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected room is unavailable';
  END IF;

  IF p_guests > v_room.capacity THEN
    RAISE EXCEPTION 'Guest count exceeds the selected room capacity';
  END IF;

  IF p_status IN ('pending', 'confirmed') THEN
    SELECT count(*)::integer INTO v_reserved
    FROM public.bookings b
    WHERE b.room_id = p_room_id
      AND b.id <> p_booking_id
      AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.otp_expires_at > now()))
      AND b.check_in_date < p_check_out
      AND b.check_out_date > p_check_in;

    IF v_reserved >= v_room.total_inventory THEN
      RAISE EXCEPTION 'Selected room is not available for those dates';
    END IF;
  END IF;

  UPDATE public.bookings
  SET room_id = p_room_id,
      guest_name = trim(p_guest_name),
      guest_email = lower(trim(p_guest_email)),
      guest_phone = trim(p_guest_phone),
      check_in_date = p_check_in,
      check_out_date = p_check_out,
      number_of_guests = p_guests,
      special_requests = nullif(trim(coalesce(p_special_requests, '')), ''),
      total_amount = (p_check_out - p_check_in) * v_room.price_per_night,
      status = p_status,
      confirmed_at = CASE WHEN p_status = 'confirmed' THEN coalesce(confirmed_at, now()) ELSE confirmed_at END,
      cancelled_at = CASE WHEN p_status = 'cancelled' THEN coalesce(cancelled_at, now()) ELSE cancelled_at END,
      updated_at = now()
  WHERE id = p_booking_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_booking(uuid,uuid,text,text,text,date,date,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_booking(uuid,uuid,text,text,text,date,date,integer,text,text) TO authenticated;

     OR p_guest_phone IS NULL OR length(trim(p_guest_phone)) = 0 THEN
    RAISE EXCEPTION 'Guest name, email and phone are required';
  END IF;

  IF p_check_in IS NULL OR p_check_out IS NULL
     OR p_check_out <= p_check_in
     OR (p_status IN ('pending', 'confirmed') AND p_check_in < current_date) THEN
    RAISE EXCEPTION 'Choose valid future check-in and check-out dates';
  END IF;

  IF p_guests IS NULL OR p_guests < 1 THEN
    RAISE EXCEPTION 'Guest count must be at least one';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('pending', 'confirmed', 'cancelled', 'completed') THEN
    RAISE EXCEPTION 'Invalid booking status';
  END IF;

  IF p_status = 'confirmed' AND NOT v_current.otp_verified THEN
    RAISE EXCEPTION 'Guest email must be verified before confirming this booking';
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = p_room_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected room is unavailable';
  END IF;

  IF p_guests > v_room.capacity THEN
    RAISE EXCEPTION 'Guest count exceeds the selected room capacity';
  END IF;

  IF p_status IN ('pending', 'confirmed') THEN
    SELECT count(*)::integer INTO v_reserved
    FROM public.bookings b
    WHERE b.room_id = p_room_id
      AND b.id <> p_booking_id
      AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.otp_expires_at > now()))
      AND b.check_in_date < p_check_out
      AND b.check_out_date > p_check_in;

    IF v_reserved >= v_room.total_inventory THEN
      RAISE EXCEPTION 'Selected room is not available for those dates';
    END IF;
  END IF;

  UPDATE public.bookings
  SET room_id = p_room_id,
      guest_name = trim(p_guest_name),
      guest_email = lower(trim(p_guest_email)),
      guest_phone = trim(p_guest_phone),
      check_in_date = p_check_in,
      check_out_date = p_check_out,
      number_of_guests = p_guests,
      special_requests = nullif(trim(coalesce(p_special_requests, '')), ''),
      total_amount = (p_check_out - p_check_in) * v_room.price_per_night,
      status = p_status,
      confirmed_at = CASE WHEN p_status = 'confirmed' THEN coalesce(confirmed_at, now()) ELSE confirmed_at END,
      cancelled_at = CASE WHEN p_status = 'cancelled' THEN coalesce(cancelled_at, now()) ELSE cancelled_at END,
      updated_at = now()
  WHERE id = p_booking_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_booking(uuid,uuid,text,text,text,date,date,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_booking(uuid,uuid,text,text,text,date,date,integer,text,text) TO authenticated;
