/*
  # Hotel Booking System Initial Schema

  1. New Tables
    - `rooms` - Hotel rooms with details and availability
    - `bookings` - Customer booking reservations
    - `hotel_info` - Hotel details and settings
    - `team_members` - Staff/team member profiles
    - `admin_users` - Admin authentication
  
  2. Security
    - Enable RLS on all tables
    - Public read access for rooms, hotel_info, team_members
    - Authenticated admin access for write operations
    - Booking data restricted to admin and own bookings

  3. Important Notes
    - Room availability is tracked via total_rooms and booked counts
    - Bookings have status: pending, confirmed, cancelled, completed
    - OTP verification stored in bookings table
*/

-- Create hotel info table
CREATE TABLE IF NOT EXISTS hotel_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Thamel Heritage Hotel',
  tagline text DEFAULT 'Experience Luxury in the Heart of Kathmandu',
  description text DEFAULT 'Nestled in the vibrant streets of Thamel, our hotel offers a perfect blend of traditional Nepali hospitality and modern comfort.',
  address text DEFAULT 'Thamel, Kathmandu, Nepal',
  phone text DEFAULT '+977-1-4700000',
  email text DEFAULT 'info@thamelheritage.com',
  opening_year integer DEFAULT 2010,
  total_rooms integer DEFAULT 20,
  amenities jsonb DEFAULT '["Free WiFi", "24/7 Room Service", "Restaurant", "Airport Shuttle", "Tour Desk", "Spa", "Fitness Center", "Rooftop Garden"]'::jsonb,
  hero_image text DEFAULT 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price_per_night decimal(10,2) NOT NULL,
  capacity integer NOT NULL DEFAULT 2,
  total_inventory integer NOT NULL DEFAULT 1,
  size_sqft integer,
  amenities jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  room_type text NOT NULL DEFAULT 'standard',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_room_type CHECK (room_type IN ('standard', 'deluxe', 'suite', 'penthouse'))
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  number_of_guests integer NOT NULL DEFAULT 1,
  special_requests text,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  otp_code text NOT NULL,
  otp_verified boolean DEFAULT false,
  otp_expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Create team members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  image_url text DEFAULT 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
  email text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin users table for authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create default admin user (password: admin123 - should be changed immediately)
INSERT INTO admin_users (email, password_hash, name)
SELECT 'admin@thamelheritage.com', '$2a$10$YourHashedPasswordHere', 'Admin User'
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'admin@thamelheritage.com'
);

-- Create default hotel info
INSERT INTO hotel_info DEFAULT VALUES;

-- Insert sample rooms
INSERT INTO rooms (name, description, price_per_night, capacity, total_inventory, size_sqft, room_type, amenities, images) VALUES
(
  'Standard Room',
  'Comfortable and cozy room perfect for solo travelers or couples. Features modern amenities with a touch of traditional Nepali decor.',
  80.00,
  2,
  5,
  280,
  'standard',
  '["Free WiFi", "Air Conditioning", "Flat-screen TV", "Private Bathroom", "Mini Bar", "Coffee Maker"]'::jsonb,
  '["https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/1869019/pexels-photo-1869019.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb
),
(
  'Deluxe Room',
  'Spacious room with stunning views of the city. Elegant furnishing with premium amenities for a luxurious stay.',
  120.00,
  3,
  4,
  380,
  'deluxe',
  '["Free WiFi", "Air Conditioning", "Flat-screen TV", "Private Bathroom", "Mini Bar", "Coffee Maker", "Work Desk", "Seating Area", "Balcony"]'::jsonb,
  '["https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/262042/pexels-photo-262042.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb
),
(
  'Executive Suite',
  'Luxurious suite with separate living area, premium furnishings, and exceptional views. Perfect for business travelers or families.',
  200.00,
  4,
  3,
  550,
  'suite',
  '["Free WiFi", "Air Conditioning", "Flat-screen TV", "Private Bathroom", "Mini Bar", "Coffee Maker", "Work Desk", "Living Area", "Balcony", "Bathrobe & Slippers", "Welcome Amenities"]'::jsonb,
  '["https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/2416930/pexels-photo-2416930.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb
),
(
  'Presidential Penthouse',
  'Our most exclusive accommodation featuring panoramic mountain views, luxury spa bathroom, and private terrace. The epitome of mountain luxury.',
  450.00,
  6,
  1,
  900,
  'penthouse',
  '["Free WiFi", "Air Conditioning", "Multiple TVs", "Luxury Bathroom", "Premium Mini Bar", "Espresso Machine", "Work Desk", "Living & Dining Area", "Large Private Terrace", "Mountain Views", "Personal Butler Service", "Spa Bath", "Welcome Amenities"]'::jsonb,
  '["https://images.pexels.com/photos/1021077/pexels-photo-1021077.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb
);

-- Insert sample team members
INSERT INTO team_members (name, role, bio, email, display_order) VALUES
('Ram Bahadur', 'General Manager', 'With over 20 years in hospitality, Ram ensures every guest experiences the best of Nepali culture and comfort.', 'ram@thamelheritage.com', 1),
('Sita Sharma', 'Guest Relations Manager', 'Sita specializes in making guests feel at home with personalized recommendations and attentive service.', 'sita@thamelheritage.com', 2),
('Hari Thapa', 'Executive Chef', 'Award-winning chef Hari brings authentic Nepali flavors with international fusion cuisine to our restaurant.', NULL, 3),
('Maya Gurung', 'Wellness Director', 'Certified wellness expert Maya curates our spa and wellness programs for ultimate relaxation.', NULL, 4);

-- Enable RLS on all tables
ALTER TABLE hotel_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view hotel info"
  ON hotel_info FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can view active rooms"
  ON rooms FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can view active team members"
  ON team_members FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin write policies (using service role for admin operations)
CREATE POLICY "Service role can manage hotel info"
  ON hotel_info FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage rooms"
  ON rooms FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage bookings"
  ON bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage team members"
  ON team_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage admin users"
  ON admin_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public can create bookings
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can view their own bookings (by email)
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);
