import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Users, Search, ArrowRight } from 'lucide-react';
import type { AvailableRoom, Room } from '../types';
import { getAvailableRooms, getRooms } from '../lib/api';

function Rooms() {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<(AvailableRoom & Room)[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<(AvailableRoom & Room)[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1);
  const [roomType, setRoomType] = useState('all');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [rooms, roomType, guests]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let data;
      if (checkIn && checkOut) {
        data = await getAvailableRooms(checkIn, checkOut);
      } else {
        data = await getRooms();
      }
      setRooms(data as (AvailableRoom & Room)[]);
      setFilteredRooms(data as (AvailableRoom & Room)[]);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = rooms;

    if (roomType !== 'all') {
      filtered = filtered.filter((room) => room.room_type === roomType);
    }

    if (guests > 1) {
      filtered = filtered.filter((room) => room.capacity >= guests);
    }

    setFilteredRooms(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRooms();
  };

  const getRoomBadgeColor = (type: string) => {
    switch (type) {
      case 'standard':
        return 'bg-gray-100 text-gray-700';
      case 'deluxe':
        return 'bg-blue-100 text-blue-700';
      case 'suite':
        return 'bg-amber-100 text-amber-700';
      case 'penthouse':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAvailableCount = (room: AvailableRoom & Room) => {
    if (room.available_inventory !== undefined) {
      return room.available_inventory;
    }
    return room.total_inventory;
  };

  return (
    <div className="pt-20">
      <section className="relative h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/262042/pexels-photo-262042.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <div className="relative h-full flex items-center justify-center text-white px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Our Rooms & Suites
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Choose from our carefully designed accommodations featuring traditional Nepali elegance and modern luxury
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white shadow-md sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users size={14} className="inline mr-1" />
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                >
                  <option value="all">All Types</option>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-2.5 px-8 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Search size={18} />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Rooms Available</h3>
              <p className="text-gray-600 mb-8">
                No rooms match your search criteria. Try adjusting your dates or filters.
              </p>
              <button
                onClick={() => {
                  setCheckIn('');
                  setCheckOut('');
                  setRoomType('all');
                  fetchRooms();
                }}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRooms.map((room) => {
                  const available = getAvailableCount(room);
                  const isBookable = available > 0;

                  return (
                    <div
                      key={room.id}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all ${
                        !isBookable ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="relative h-64">
                        <img
                          src={room.images[0] || 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg'}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRoomBadgeColor(room.room_type)}`}>
                            {room.room_type}
                          </span>
                        </div>
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
                          <div className="text-2xl font-bold text-amber-600">रु. {Number(room.price_per_night).toLocaleString('en-IN')}</div>
                          <div className="text-xs text-gray-500 text-center">per night</div>
                        </div>
                        {!isBookable && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold">
                              Fully Booked
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {room.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center">
                            <Users size={16} className="mr-1" />
                            {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                          </span>
                          {room.size_sqft && (
                            <span>{room.size_sqft} sq ft</span>
                          )}
                          {available !== undefined && (
                            <span className={`font-medium ${available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {available} available
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {room.amenities.slice(0, 4).map((amenity, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {amenity}
                            </span>
                          ))}
                          {room.amenities.length > 4 && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              +{room.amenities.length - 4} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/rooms/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center font-medium"
                          >
                            View Details
                          </Link>
                          {isBookable && (
                            <Link
                              to={`/booking/${room.id}?checkIn=${checkIn || today}&checkOut=${checkOut || tomorrow}&guests=${guests}`}
                              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all text-center flex items-center justify-center space-x-2"
                            >
                              <span>Book Now</span>
                              <ArrowRight size={18} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Rooms;
