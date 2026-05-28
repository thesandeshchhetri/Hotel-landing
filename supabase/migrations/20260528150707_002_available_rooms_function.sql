/*
  # Add Room Availability Function

  1. New Functions
    - get_available_rooms - Returns rooms with available inventory for given dates
  
  2. Purpose
    - Calculate how many rooms are available for specific check-in/check-out dates
    - Exclude fully booked rooms from results
*/

CREATE OR REPLACE FUNCTION get_available_rooms(
  p_check_in date,
  p_check_out date
)
RETURNS TABLE (
  room_id uuid,
  room_name text,
  description text,
  price_per_night decimal,
  capacity integer,
  available_inventory integer,
  size_sqft integer,
  room_type text,
  amenities jsonb,
  images jsonb,
  total_inventory integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as room_id,
    r.name as room_name,
    r.description,
    r.price_per_night,
    r.capacity,
    (r.total_inventory - (
      SELECT COUNT(*)::integer
      FROM bookings b
      WHERE b.room_id = r.id
        AND b.status IN ('pending', 'confirmed')
        AND b.check_in_date < p_check_out
        AND b.check_out_date > p_check_in
    )) as available_inventory,
    r.size_sqft,
    r.room_type,
    r.amenities,
    r.images,
    r.total_inventory
  FROM rooms r
  WHERE r.is_active = true
    AND r.total_inventory > 0;
END;
$$ LANGUAGE plpgsql STABLE;
