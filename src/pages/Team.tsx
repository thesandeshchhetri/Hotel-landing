import { useState, useEffect } from 'react';
import { Mail, Award } from 'lucide-react';
import type { TeamMember } from '../types';
import { getTeamMembers } from '../lib/api';

function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const data = await getTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20">
      <section className="relative h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <div className="relative h-full flex items-center justify-center text-white px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Meet Our Team
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Dedicated professionals committed to making your stay exceptional
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading team members...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
                  Our Leadership Team
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  With decades of combined experience in luxury hospitality, our team brings passion and expertise to every aspect of your stay
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
                  >
                    <div className="relative h-72 overflow-hidden">
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-2">
                          <Award size={16} className="text-amber-400" />
                          <span className="text-amber-400 text-sm font-medium">{member.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-amber-600 font-medium mb-4">{member.role}</p>
                      {member.bio && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{member.bio}</p>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center justify-center space-x-2 text-sm text-gray-500 hover:text-amber-600 transition-colors"
                        >
                          <Mail size={16} />
                          <span>{member.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
                Join Our Team
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We're always looking for passionate individuals who share our commitment to exceptional hospitality
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={28} className="text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Growth Opportunities</h3>
                <p className="text-gray-600 text-sm">
                  We invest in our team members' professional development and career growth
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Great Culture</h3>
                <p className="text-gray-600 text-sm">
                  Join a supportive team that values collaboration, respect, and excellence
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={28} className="text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Competitive Benefits</h3>
                <p className="text-gray-600 text-sm">
                  Enjoy competitive salary, health benefits, and exclusive perks
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <a
                href="mailto:careers@thamelheritage.com"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
              >
                <Mail size={20} />
                <span> careers@thamelheritage.com</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Team;
