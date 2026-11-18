import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Users, Phone, Mail, Home, ArrowRight } from 'lucide-react';
import type { Booking, Room } from '../types';


function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = location.state?.bookingId;

  useEffect(() => {
    if (!bookingId) { navigate('/'); return; }
    try {
      const raw = sessionStorage.getItem('confirmedBooking');
      if (!raw) { navigate('/'); return; }
      const parsed = JSON.parse(raw) as Booking;
      if (parsed.id !== bookingId || parsed.status !== 'confirmed') { navigate('/'); return; }
      setBooking(parsed);
    } catch (error) {
      console.error('Unable to load confirmation:', error);
      navigate('/');
    } finally { setLoading(false); }
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
        <Link to="/rooms" className="text-amber-600 hover:text-amber-700">
          Browse Available Rooms
        </Link>
      </div>
    );
  }

  const room = booking.room as Room;

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-green-100">
              Thank you, {booking.guest_name}! Your reservation has been successfully confirmed.
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Confirmation Number</span>
                  <span className="font-mono font-bold text-amber-600">{booking.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Status</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    Confirmed
                  </span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Guest Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Users size={18} className="text-amber-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Guest Name</p>
                      <p className="font-medium text-gray-900">{booking.guest_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail size={18} className="text-amber-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{booking.guest_email}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone size={18} className="text-amber-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{booking.guest_phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Stay Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar size={18} className="text-amber-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar size={18} className="text-amber-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users size={18} className="text-amber-600 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p className="font-medium text-gray-900">
                        {booking.number_of_guests} {booking.number_of_guests === 1 ? 'Guest' : 'Guests'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {room && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Room Details</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="flex items-center">
                    <div className="w-32 h-24 flex-shrink-0">
                      <img
                        src={room.images[0] || 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg'}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-grow">
                      <p className="text-sm text-amber-600 uppercase tracking-wider font-semibold">
                        {room.room_type}
                      </p>
                      <h4 className="font-bold text-gray-900">{room.name}</h4>
                      <p className="text-sm text-gray-600">{room.size_sqft} sq ft</p>
                    </div>
                    <div className="pr-4 text-right">
                      <p className="text-2xl font-bold text-amber-600">${booking.total_amount}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {booking.special_requests && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Special Requests</h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{booking.special_requests}</p>
              </div>
            )}

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
              <p className="text-blue-800 text-sm">
                A confirmation email has been sent to <strong>{booking.guest_email}</strong> with all your booking details.
                Please save your confirmation number for future reference.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/"
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Home size={20} />
                <span>Back to Home</span>
              </Link>
              <Link
                to="/rooms"
                className="flex-1 py-3 px-6 border-2 border-amber-600 text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Book Another Room</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;
