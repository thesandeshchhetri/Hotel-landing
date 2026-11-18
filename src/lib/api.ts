import { supabase } from './supabase';
import type { HotelInfo, Room, TeamMember, Booking, BookingFormData, AvailableRoom } from '../types';

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


export async function createBooking(formData: BookingFormData): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke('create-booking', { body: formData });
  if (error) throw error;
  if (!data?.id) throw new Error('Booking could not be created.');
  return { id: data.id };
}

export async function verifyBookingOtp(bookingId: string, otp: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  const { data, error } = await supabase.functions.invoke('verify-otp', { body: { bookingId, otp } });
  if (error) throw error;
  return data;
}

