import { supabase } from './supabase';
import type { HotelInfo, Room, TeamMember, Booking, BookingFormData, AvailableRoom } from '../types';
import { sendOTPEmail, initEmailJS } from './emailjs';

// Initialize EmailJS on module load
initEmailJS();

export async function getHotelInfo(): Promise<HotelInfo | null> {
  const { data, error } = await supabase
    .from('hotel_info')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('price_per_night', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAvailableRooms(
  checkIn: string,
  checkOut: string
): Promise<AvailableRoom[]> {
  const { data, error } = await supabase.rpc('get_available_rooms', {
    p_check_in: checkIn,
    p_check_out: checkOut
  });

  if (error) throw error;
  return data || [];
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getBookingByOtp(email: string, otp: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, room:rooms(*)')
    .eq('guest_email', email)
    .eq('otp_code', otp)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createBooking(formData: BookingFormData & { otp_code: string; otp_expires_at: string; total_amount: number }): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert([formData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function verifyBookingOtp(bookingId: string, otp: string): Promise<{ success: boolean; booking?: Booking }> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ bookingId, otp }),
  });

  const result = await response.json();
  return result;
}

export async function sendOtpEmail(email: string, otp: string, guestName: string): Promise<{ success: boolean }> {
  // Get hotel name for email
  let hotelName = 'Thamel Heritage Hotel';
  try {
    const hotelInfo = await getHotelInfo();
    if (hotelInfo?.name) {
      hotelName = hotelInfo.name;
    }
  } catch (e) {
    console.log('Using default hotel name');
  }

  // Use EmailJS to send OTP
  const result = await sendOTPEmail({
    to_email: email,
    to_name: guestName,
    otp_code: otp,
    hotel_name: hotelName,
  });

  return { success: result.success };
}
