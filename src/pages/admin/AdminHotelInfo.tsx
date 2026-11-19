import { useState, useEffect } from 'react';
import { Save, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { HotelInfo } from '../../types';

function AdminHotelInfo() {
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedHeroFile, setSelectedHeroFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    opening_year: '',
    total_rooms: '',
    amenities: '',
    hero_image: '',
  });

  useEffect(() => {
    fetchHotelInfo();
  }, []);

  const fetchHotelInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_info')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setHotelInfo(data);
        setFormData({
          name: data.name,
          tagline: data.tagline || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          opening_year: data.opening_year?.toString() || '2010',
          total_rooms: data.total_rooms?.toString() || '20',
          amenities: (data.amenities || []).join(', '),
          hero_image: data.hero_image || '',
        });
      }
    } catch (error) {
      console.error('Error fetching hotel info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let heroImage = formData.hero_image;
      if (selectedHeroFile) {
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.error || !refreshed.data.session) throw new Error('Your admin session has expired. Sign in again.');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user || userData.user.app_metadata?.role !== 'admin') throw new Error('Administrator access is required.');
        const safeName = selectedHeroFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const path = userData.user.id + '/hotel/' + crypto.randomUUID() + '-' + safeName;
        const { error: uploadError } = await supabase.storage.from('room-images').upload(path, selectedHeroFile, {
          cacheControl: '3600', contentType: selectedHeroFile.type, upsert: false,
        });
        if (uploadError) throw uploadError;
        heroImage = supabase.storage.from('room-images').getPublicUrl(path).data.publicUrl;
      }

      const updateData = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        opening_year: parseInt(formData.opening_year),
        total_rooms: parseInt(formData.total_rooms),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
        hero_image: heroImage,
        updated_at: new Date().toISOString(),
      };

      if (hotelInfo) {
        const { error } = await supabase
          .from('hotel_info')
          .update(updateData)
          .eq('id', hotelInfo.id);
        if (error) throw error;
      }

      setSelectedHeroFile(null);
      alert('Hotel information updated successfully!');
      fetchHotelInfo();
    } catch (error) {
      console.error('Error updating hotel info:', error);
      alert('Failed to update hotel information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hotel Information</h1>
        <p className="text-gray-600">Manage your hotel details and settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex items-center space-x-3">
          <Building size={24} className="text-amber-600" />
          <div>
            <h2 className="font-bold">General Settings</h2>
            <p className="text-sm text-gray-500">Update your hotel's basic information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hotel Name*
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Experience Luxury in the Heart of Kathmandu"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Tell visitors about your hotel..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Thamel, Kathmandu, Nepal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="+977-1-4700000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="info@thamelheritage.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Year
              </label>
              <input
                type="number"
                value={formData.opening_year}
                onChange={(e) => setFormData({ ...formData, opening_year: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Rooms
              </label>
              <input
                type="number"
                value={formData.total_rooms}
                onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                min="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Free WiFi, Restaurant, Spa, Airport Shuttle"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate each amenity with a comma
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Hero Image
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  event.target.value = '';
                  if (file && (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                    alert('Choose a JPG, PNG, WEBP or AVIF image up to 5 MB.');
                    return;
                  }
                  setSelectedHeroFile(file);
                }}
                className="mb-3 w-full text-sm text-gray-700"
              />
              {selectedHeroFile && <p className="mb-2 text-xs text-green-700">Selected: {selectedHeroFile.name}</p>}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or use Hero Image URL
              </label>
              <input
                type="url"
                value={formData.hero_image}
                onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="https://example.com/hero-image.jpg"
              />
              {formData.hero_image && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img
                    src={formData.hero_image}
                    alt="Hero preview"
                    className="h-40 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all disabled:opacity-50"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminHotelInfo;
