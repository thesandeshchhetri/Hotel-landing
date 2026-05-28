import { useOutletContext } from 'react-router-dom';
import { MapPin, Calendar, Award, Heart, Users, Star } from 'lucide-react';
import type { HotelInfo } from '../types';

function About() {
  const { hotelInfo } = useOutletContext<{ hotelInfo: HotelInfo | null }>();

  const stats = [
    {
      icon: Calendar,
      value: hotelInfo?.opening_year || 2010,
      label: 'Year Established',
    },
    {
      icon: Award,
      value: hotelInfo?.total_rooms || 20,
      label: 'Luxury Rooms',
    },
    {
      icon: Users,
      value: '10,000+',
      label: 'Happy Guests',
    },
    {
      icon: Star,
      value: '4.8',
      label: 'Customer Rating',
    },
  ];

  return (
    <div className="pt-20">
      <section className="relative h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <div className="relative h-full flex items-center justify-center text-white px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              About Us
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover the story behind {hotelInfo?.name || 'Thamel Heritage Hotel'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                {hotelInfo?.description || 'Nestled in the vibrant streets of Thamel, our hotel offers a perfect blend of traditional Nepali hospitality and modern comfort. Since our establishment, we have been committed to providing an authentic and memorable experience for every guest who walks through our doors.'}
              </p>
              <p className="text-gray-600 text-lg mb-6">
                Our journey began with a simple vision: to create a sanctuary where travelers could experience the warmth of Nepali culture while enjoying world-class amenities. Today, we continue to uphold the traditions of our heritage while embracing the comforts of modern hospitality.
              </p>
              <p className="text-gray-600 text-lg">
                Every detail of our hotel has been carefully curated to reflect the rich cultural tapestry of Nepal. From the intricate wood carvings in our lobby to the authentic flavors served in our restaurant, we invite you to embark on a journey of discovery and relaxation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.pexels.com/photos/2387871/pexels-photo-2387871.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Hotel heritage"
                className="rounded-lg shadow-lg w-full h-48 object-cover"
              />
              <img
                src="https://images.pexels.com/photos/2161463/pexels-photo-2161463.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Nepalese culture"
                className="rounded-lg shadow-lg w-full h-48 object-cover mt-8"
              />
              <img
                src="https://images.pexels.com/photos/2161449/pexels-photo-2161449.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Mountain views"
                className="rounded-lg shadow-lg w-full h-48 object-cover"
              />
              <img
                src="https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Kathmandu"
                className="rounded-lg shadow-lg w-full h-48 object-cover mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Our Statistics
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A testament to our commitment to excellence and guest satisfaction
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={28} className="text-amber-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={40} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Warm Hospitality</h3>
              <p className="text-gray-600">
                We believe in treating every guest like family, ensuring your stay is filled with warmth and personal attention.
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award size={40} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600">
                From our rooms to our service, we strive for perfection in every detail to exceed your expectations.
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={40} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Authentic Experience</h3>
              <p className="text-gray-600">
                We preserve and share the rich cultural heritage of Nepal, offering you an authentic local experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Visit Us in Thamel
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Located in the heart of Kathmandu's most vibrant district, surrounded by shops, restaurants, and cultural attractions
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Getting Here</h3>
                <p className="text-gray-300 mb-6">
                  {hotelInfo?.address || 'Thamel, Kathmandu, Nepal'} is easily accessible from Tribhuvan International Airport (about 20 minutes by taxi). We also offer airport shuttle services for our guests.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin size={20} className="mr-3 mt-1 text-amber-500" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-400">{hotelInfo?.address || 'Thamel, Kathmandu, Nepal'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden h-64">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14131.069847688432!2d85.30728465!3d27.7150974!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb18fcf2c6f565%3A0x51c0b30d8f7f9c0!2sThamel%2C%20Kathmandu%2044600%2C%20Nepal!5e0!3m2!1sen!2s!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
