export interface HotelInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  opening_year: number;
  total_rooms: number;
  amenities: string[];
  hero_image: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  total_inventory: number;
  size_sqft: number | null;
  room_type: 'standard' | 'deluxe' | 'suite' | 'penthouse';
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableRoom extends Room {
  available_inventory: number;
}

export interface Booking {
  id: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  special_requests: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  otp_code: string;
  otp_verified: boolean;
  otp_expires_at: string;
  verified_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string;
  email: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingFormData {
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  special_requests?: string;
}

export interface DateRange {
  checkIn: string;
  checkOut: string;
}
