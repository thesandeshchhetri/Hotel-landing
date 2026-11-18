import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Check, ArrowLeft, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Room } from '../types';
import { getRoomById, getAvailableRooms } from '../lib/api';

function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1);
  const [nights, setNights] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  useEffect(() => {
    fetchRoom();
  }, [id]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setNights(diff > 0 ? diff : 0);
    }
  }, [checkIn, checkOut]);

  const fetchRoom = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getRoomById(id);
      if (data) {
        setRoom(data);
        if (checkIn && checkOut) {
          const available = await getAvailableRooms(checkIn, checkOut);
          const roomAvail = available.find((r) => r.id === id);
          if (roomAvail) {
            setAvailableCount(roomAvail.available_inventory);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch room:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (!room) return;
    setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = () => {
    if (!room) return;
    setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
  };

  const handleBooking = () => {
    navigate(`/booking/${id}?checkIn=${checkIn || today}&checkOut=${checkOut || tomorrow}&guests=${guests}`);
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
          Back to Rooms
        </Link>
      </div>
    );
  }

  const totalPrice = nights > 0 ? room.price_per_night * nights : room.price_per_night;

  return (
    <div className="pt-20">
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/rooms"
            className="inline-flex items-center text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Rooms
          </Link>
        </div>
      </div>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative h-[500px] rounded-2xl overflow-hidden mb-4">
                <img
                  src={room.images[currentImageIndex] || 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg'}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                {room.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft size={24} className="text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight size={24} className="text-gray-800" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {room.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        currentImageIndex === idx ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {room.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {room.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-20 rounded-lg overflow-hidden ${
                        currentImageIndex === idx ? 'ring-2 ring-amber-600' : ''
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${room.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="sticky top-24">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <div className="mb-4">
                    <span className="text-sm uppercase tracking-wider text-amber-600 font-semibold">
                      {room.room_type}
                    </span>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mt-1">
                      {room.name}
                    </h1>
                  </div>

                  <div className="flex items-center space-x-4 text-gray-600 mb-6">
                    <span className="flex items-center">
                      <Users size={18} className="mr-2" />
                      Up to {room.capacity} guests
                    </span>
                    {room.size_sqft && (
                      <span>{room.size_sqft} sq ft</span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-6">{room.description}</p>

                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar size={14} className="inline mr-1" />
                          Check In
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={today}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar size={14} className="inline mr-1" />
                          Check Out
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || today}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users size={14} className="inline mr-1" />
                        Guests
                      </label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                      >
                        {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Guest' : 'Guests'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {nights > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">
                            ${room.price_per_night} x {nights} night{nights > 1 ? 's' : ''}
                          </span>
                          <span className="font-semibold">${(room.price_per_night * nights).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span className="text-amber-600">${totalPrice.toFixed(2)}</span>
                        </div>
                        {availableCount !== null && (
                          <p className={`text-sm mt-2 ${availableCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {availableCount > 0
                              ? `${availableCount} room${availableCount > 1 ? 's' : ''} available`
                              : 'Fully booked for these dates'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={nights === 0 || (availableCount !== null && availableCount === 0)}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>Book This Room</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">Room Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {room.amenities.map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check size={18} className="text-green-600" />
                </div>
                <span className="text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default RoomDetail;
