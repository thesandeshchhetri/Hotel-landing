import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, User, Mail, Phone, MessageSquare, ArrowLeft, Check, ArrowRight, Loader2 } from 'lucide-react';
import type { Room } from '../types';
import { getRoomById, createBooking, sendOtpEmail } from '../lib/api';

function Booking() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    special_requests: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const checkIn = searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
  const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const guests = Number(searchParams.get('guests')) || 1;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    fetchRoom();
  }, [roomId]);

  const fetchRoom = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const data = await getRoomById(roomId);
      setRoom(data);
    } catch (error) {
      console.error('Failed to fetch room:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Name is required';
    }

    if (!formData.guest_email.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Invalid email format';
    }

    if (!formData.guest_phone.trim()) {
      newErrors.guest_phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.guest_phone)) {
      newErrors.guest_phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !room) return;

    setSubmitting(true);
    try {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const totalAmount = room.price_per_night * nights;

      const booking = await createBooking({
        room_id: room.id,
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone,
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: guests,
        special_requests: formData.special_requests || null,
        total_amount: totalAmount,
        otp_code: otp,
        otp_expires_at: expiresAt.toISOString(),
      });

      await sendOtpEmail(formData.guest_email, otp, formData.guest_name);

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
      setErrors({ submit: 'Failed to create booking. Please try again.' });
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
            Please fill in your details to reserve {room.name}. An OTP will be sent to your email for verification.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Guest Information</h2>

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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 transition-colors ${
                      errors.guest_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.guest_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.guest_name}</p>
                  )}
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 transition-colors ${
                      errors.guest_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.guest_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.guest_email}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    OTP will be sent to this email for verification
                  </p>
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 transition-colors ${
                      errors.guest_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+977 98XXXXXXXX"
                  />
                  {errors.guest_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.guest_phone}</p>
                  )}
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
                  disabled={submitting}
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
                        <p className="font-medium">{new Date(checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Calendar size={18} className="mr-3 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-medium">{new Date(checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
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
                      <span className="text-gray-600">${room.price_per_night} x {nights} night{nights > 1 ? 's' : ''}</span>
                      <span className="font-medium">${(room.price_per_night * nights).toFixed(2)}</span>
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
