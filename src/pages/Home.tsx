import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Calendar, Users, Star, ChevronRight, ArrowRight, Wifi, Coffee, Car, Dumbbell, Utensils, Sparkles } from 'lucide-react';
import type { HotelInfo, Room, TeamMember, SiteSettings } from '../types';
import { getRooms, getTeamMembers } from '../lib/api';

function Home() {
  const { hotelInfo, siteSettings } = useOutletContext<{ hotelInfo: HotelInfo | null; siteSettings: SiteSettings | null }>();
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    async function fetchData() {
      try {
        const [rooms, team] = await Promise.all([
          getRooms(),
          getTeamMembers(),
        ]);
        setFeaturedRooms(rooms.slice(0, 3));
        setTeamMembers(team.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }
    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/rooms?checkIn=${checkIn || today}&checkOut=${checkOut || tomorrow}&guests=${guests}`;
  };

  const amenityIcons: { [key: string]: React.ReactNode } = {
    'Free WiFi': <Wifi size={24} />,
    '24/7 Room Service': <Coffee size={24} />,
    'Restaurant': <Utensils size={24} />,
    'Airport Shuttle': <Car size={24} />,
    'Fitness Center': <Dumbbell size={24} />,
    'Spa': <Sparkles size={24} />,
  };

  return (
    <div>
      <section className="relative h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${siteSettings?.page_images?.homepage_hero || hotelInfo?.hero_image || 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600'}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          <div className="text-center max-w-4xl mb-12">
            <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6 animate-fade-in">
              {hotelInfo?.name || 'Thamel Heritage Hotel'}
            </h2>
            <p className="text-xl md:text-2xl font-light text-amber-100 mb-8">
              {hotelInfo?.tagline || 'Experience Luxury in the Heart of Kathmandu'}
            </p>
            <div className="flex items-center justify-center space-x-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={24} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>

          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-6 md:p-8">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Check In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Check Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-1" />
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-gray-900"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>Check Availability</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight size={32} className="text-white rotate-90" />
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Our Amenities
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enjoy world-class facilities designed for your comfort and convenience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {(hotelInfo?.amenities || [
              'Free WiFi',
              '24/7 Room Service',
              'Restaurant',
              'Airport Shuttle',
              'Fitness Center',
              'Spa',
            ]).map((amenity, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center group"
              >
                <div className="flex justify-center mb-4 text-amber-600 group-hover:scale-110 transition-transform">
                  {amenityIcons[amenity] || <Sparkles size={24} />}
                </div>
                <h4 className="text-sm font-medium text-gray-700">{amenity}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Featured Rooms
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our carefully designed rooms that blend traditional Nepali elegance with modern luxury
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRooms.map((room) => (
              <div
                key={room.id}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={room.images[0] || 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg'}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    ${room.price_per_night}/night
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xl font-bold text-gray-900">{room.name}</h4>
                    <span className="text-xs uppercase tracking-wider text-amber-600 font-semibold">
                      {room.room_type}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users size={16} className="mr-1" />
                        {room.capacity}
                      </span>
                      {room.size_sqft && (
                        <span>{room.size_sqft} sq ft</span>
                      )}
                    </div>
                    <Link
                      to={`/rooms/${room.id}`}
                      className="text-amber-600 hover:text-amber-700 font-medium flex items-center"
                    >
                      View Details
                      <ArrowRight size={16} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/rooms"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
            >
              <span>View All Rooms</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
                Welcome to Thamel
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                {hotelInfo?.description || 'Nestled in the vibrant streets of Thamel, our hotel offers a perfect blend of traditional Nepali hospitality and modern comfort. With stunning mountain views, authentic Nepali cuisine, and warm hospitality, we ensure an unforgettable experience.'}
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <Star size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Prime Location</h4>
                    <p className="text-gray-600 text-sm">
                      Located in the heart of Thamel, walking distance to shops, restaurants, and cultural sites
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <Star size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Mountain Views</h4>
                    <p className="text-gray-600 text-sm">
                      Breathtaking views of the Himalayan mountain range from select rooms and rooftop
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <Star size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Authentic Experience</h4>
                    <p className="text-gray-600 text-sm">
                      Traditional Nepali architecture with modern amenities for the perfect blend
                    </p>
                  </div>
                </li>
              </ul>
              <Link
                to="/about"
                className="inline-flex items-center space-x-2 mt-8 text-amber-600 hover:text-amber-700 font-semibold"
              >
                <span>Learn More About Us</span>
                <ArrowRight size={20} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src={siteSettings?.page_images?.home_gallery_1 || "https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=800"}
                alt="Kathmandu"
                className="rounded-lg shadow-lg w-full h-48 object-cover"
              />
              <img
                src={siteSettings?.page_images?.home_gallery_2 || "https://images.pexels.com/photos/2387871/pexels-photo-2387871.jpeg?auto=compress&cs=tinysrgb&w=800"}
                alt="Nepal heritage"
                className="rounded-lg shadow-lg w-full h-48 object-cover mt-8"
              />
              <img
                src={siteSettings?.page_images?.home_gallery_3 || "https://images.pexels.com/photos/2161463/pexels-photo-2161463.jpeg?auto=compress&cs=tinysrgb&w=800"}
                alt="Temple"
                className="rounded-lg shadow-lg w-full h-48 object-cover"
              />
              <img
                src={siteSettings?.page_images?.home_gallery_4 || "https://images.pexels.com/photos/2161449/pexels-photo-2161449.jpeg?auto=compress&cs=tinysrgb&w=800"}
                alt="Mountain view"
                className="rounded-lg shadow-lg w-full h-48 object-cover mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Meet Our Team
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Dedicated professionals committed to making your stay exceptional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="text-center group"
              >
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden">
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h4>
                <p className="text-amber-600 font-medium mb-2">{member.role}</p>
                {member.bio && (
                  <p className="text-gray-600 text-sm line-clamp-3">{member.bio}</p>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/team"
              className="inline-flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-semibold"
            >
              <span>Meet the Full Team</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
