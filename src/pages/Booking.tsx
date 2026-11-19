import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, User, Mail, Phone, MessageSquare, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { Room } from '../types';
import { getRoomById, getAvailableRooms, createBooking } from '../lib/api';

function localDateString(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Booking() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || localDateString());
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || localDateString(1));
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'error'>('idle');
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    special_requests: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const guests = Number(searchParams.get('guests')) || 1;
  const today = localDateString();
  const datesValid = checkIn >= today && checkOut > checkIn;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const nights = datesValid
    ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  useEffect(() => {
    let active = true;

    const fetchRoom = async () => {
      if (!roomId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getRoomById(roomId);
        if (active) setRoom(data);
      } catch (error) {
        console.error('Failed to fetch room:', error);
        if (active) setRoom(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchRoom();
    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    let active = true;

    if (!roomId || !datesValid) {
      setAvailableCount(null);
      setAvailabilityStatus('idle');
      return () => {
        active = false;
      };
    }

    setAvailableCount(null);
    setAvailabilityStatus('checking');

    const checkAvailability = async () => {
      try {
        const availableRooms = await getAvailableRooms(checkIn, checkOut);
        if (!active) return;
        const selectedRoom = availableRooms.find((item) => item.id === roomId);
        const count = selectedRoom?.available_inventory ?? 0;
        setAvailableCount(count);
        setAvailabilityStatus(count > 0 ? 'available' : 'unavailable');
      } catch (error) {
        console.error('Failed to check room availability:', error);
        if (active) setAvailabilityStatus('error');
      }
    };

    void checkAvailability();
    return () => {
      active = false;
    };
  }, [roomId, checkIn, checkOut, datesValid]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!datesValid) {
      newErrors.dates = 'Choose a valid check-in and check-out date. Check-out must be after check-in.';
    } else if (availabilityStatus !== 'available' || (availableCount ?? 0) < 1) {
      newErrors.availability = 'This room is not available for the selected dates. Please choose different dates.';
    }

    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Name is required';
    }

    if (!formData.guest_email.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email.trim())) {
      newErrors.guest_email = 'Invalid email format';
    }

    if (!formData.guest_phone.trim()) {
      newErrors.guest_phone = 'Phone number is required';
    } else if (!/^(?:\+977)?9[6-8]\d{8}$/.test(formData.guest_phone.replace(/[\s-]/g, ''))) {
      newErrors.guest_phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    if (value && checkOut <= value) {
      setCheckOut(nextDate(value));
    }
    setErrors((current) => ({ ...current, dates: '', availability: '', submit: '' }));
  };

  const handleCheckOutChange = (value: string) => {
    setCheckOut(value);
    setErrors((current) => ({ ...current, dates: '', availability: '', submit: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !room || availabilityStatus !== 'available') return;

    setSubmitting(true);
    try {
      const booking = await createBooking({
        room_id: room.id,
        guest_name: formData.guest_name.trim(),
        guest_email: formData.guest_email.trim().toLowerCase(),
        guest_phone: formData.guest_phone.trim(),
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: guests,
        special_requests: formData.special_requests.trim() || undefined,
      });

      sessionStorage.setItem('pendingBooking', JSON.stringify({
        id: booking.id,
        email: formData.guest_email,
        guest_name: formData.guest_name,
      }));

      navigate('/verify-otp', {
        state: {
          bookingId: booking.id,
          email: formData.guest_email,
          guestName: formData.guest_name,
        },
      });
    } catch (error) {
      console.error('Failed to create booking:', error);
      setErrors({ submit: 'Failed to create booking. The room may no longer be available for these dates. Please check the dates and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h2>
        <Link to="/rooms" className="text-amber-600 hover:text-amber-700">
          Browse Available Rooms
        </Link>
      </div>
    );
  }

  const totalAmount = room.price_per_night * nights;

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/rooms/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
            className="inline-flex items-center text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Room Details
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
            Complete Your Booking
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Please fill in your details to reserve {room.name}. You can change your stay dates below. An OTP will be sent to your email for verification.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Guest Information</h2>

              <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stay Dates</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="booking-check-in" className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Check-in
                    </label>
                    <input
                      id="booking-check-in"
                      type="date"
                      value={checkIn}
                      min={today}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="booking-check-out" className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Check-out
                    </label>
                    <input
                      id="booking-check-out"
                      type="date"
                      value={checkOut}
                      min={checkIn ? nextDate(checkIn) : nextDate(today)}
                      onChange={(e) => handleCheckOutChange(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                {availabilityStatus === 'checking' && (
                  <p className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Checking room availability for these dates...
                  </p>
                )}
                {availabilityStatus === 'available' && (
                  <p className="mt-3 text-sm text-green-700">
                    {availableCount} room{availableCount === 1 ? '' : 's'} available for your selected dates.
                  </p>
                )}
                {availabilityStatus === 'unavailable' && (
                  <p className="mt-3 text-sm text-red-600">
                    This room is fully booked for these dates. Please select another date range.
                  </p>
                )}
                {availabilityStatus === 'error' && (
                  <p className="mt-3 text-sm text-red-600">
                    We could not check availability. Please change the dates or refresh the page and try again.
                  </p>
                )}
                {errors.dates && <p className="mt-2 text-sm text-red-600">{errors.dates}</p>}
                {errors.availability && <p className="mt-2 text-sm text-red-600">{errors.availability}</p>}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 transition-colors ${errors.guest_name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your full name"
                  />
                  {errors.guest_name && <p className="text-red-500 text-sm mt-1">{errors.guest_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-1" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 transition-colors ${errors.guest_email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="your.email@example.com"
                  />
                  {errors.guest_email && <p className="text-red-500 text-sm mt-1">{errors.guest_email}</p>}
                  <p className="text-gray-500 text-sm mt-1">OTP will be sent to this email for verification</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-1" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 transition-colors ${errors.guest_phone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="+977 98XXXXXXXX"
                  />
                  {errors.guest_phone && <p className="text-red-500 text-sm mt-1">{errors.guest_phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare size={16} className="inline mr-1" />
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={formData.special_requests}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Any special requirements or requests..."
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{errors.submit}</p>
                </div>
              )}

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={submitting || availabilityStatus === 'checking' || availabilityStatus !== 'available' || (availableCount ?? 0) < 1 || !datesValid}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP & Continue</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div>
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="h-48">
                  <img
                    src={room.images[0] || 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg'}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <span className="text-sm uppercase tracking-wider text-amber-600 font-semibold">
                      {room.room_type}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{room.name}</h3>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Calendar size={18} className="mr-3 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p className="font-medium">{formatDate(checkIn)}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Calendar size={18} className="mr-3 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-medium">{formatDate(checkOut)}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Users size={18} className="mr-3 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-500">Guests</p>
                        <p className="font-medium">{guests} {guests === 1 ? 'Guest' : 'Guests'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">${room.price_per_night} x {nights} night{nights === 1 ? '' : 's'}</span>
                      <span className="font-medium">${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="text-amber-600">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;
