import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Palette, Save, UploadCloud, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Theme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};

type PageImages = Record<string, string>;

const DEFAULT_THEME: Theme = {
  primary: '#d97706',
  secondary: '#1f2937',
  accent: '#f59e0b',
  background: '#f9fafb',
  text: '#111827',
};

const IMAGE_SLOTS = [
  { key: 'homepage_hero', label: 'Homepage hero' },
  { key: 'home_gallery_1', label: 'Homepage gallery image 1' },
  { key: 'home_gallery_2', label: 'Homepage gallery image 2' },
  { key: 'home_gallery_3', label: 'Homepage gallery image 3' },
  { key: 'home_gallery_4', label: 'Homepage gallery image 4' },
  { key: 'about_hero', label: 'About page hero' },
  { key: 'about_gallery_1', label: 'About page gallery image 1' },
  { key: 'about_gallery_2', label: 'About page gallery image 2' },
  { key: 'about_gallery_3', label: 'About page gallery image 3' },
  { key: 'about_gallery_4', label: 'About page gallery image 4' },
  { key: 'team_hero', label: 'Team page hero' },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function AdminWebsiteSettings() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [pageImages, setPageImages] = useState<PageImages>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error: loadError } = await supabase.from('site_settings').select('*').eq('id', 'global').maybeSingle();
        if (loadError) throw loadError;
        if (data) {
          setTheme({ ...DEFAULT_THEME, ...(data.theme || {}) });
          setPageImages(data.page_images || {});
        }
      } catch (loadError) {
        console.error('Could not load website settings:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Could not load website settings.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const uploadImage = async (key: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE) {
      setError('Choose a JPG, PNG, WEBP or AVIF image up to 5 MB.');
      return;
    }

    setError('');
    setSuccess('');
    setUploadingKey(key);
    try {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) throw new Error('Your admin session has expired. Sign in again.');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user || userData.user.app_metadata?.role !== 'admin') throw new Error('Administrator access is required to upload images.');

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = userData.user.id + '/site/' + key + '-' + crypto.randomUUID() + '.' + extension;
      const { error: uploadError } = await supabase.storage.from('room-images').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('room-images').getPublicUrl(path);
      setPageImages((current) => ({ ...current, [key]: data.publicUrl }));
      setSuccess('Image uploaded. Save changes to publish it on the website.');
    } catch (uploadError) {
      console.error('Website image upload failed:', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setUploadingKey(null);
    }
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session || refreshed.data.session.user.app_metadata?.role !== 'admin') {
        throw new Error('Your administrator session is not valid. Sign in again.');
      }
      const { error: saveError } = await supabase.from('site_settings').update({
        theme,
        page_images: pageImages,
        updated_at: new Date().toISOString(),
      }).eq('id', 'global');
      if (saveError) throw saveError;
      setSuccess('Website colors and images saved successfully.');
    } catch (saveError) {
      console.error('Could not save website settings:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Could not save website settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center"><RefreshCw className="mx-auto animate-spin text-amber-600" size={28} />Loading website settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website Appearance & Images</h1>
        <p className="text-gray-600">Customize the public website colors and upload images for its main pages.</p>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        <section className="rounded-xl bg-white p-6 shadow-md">
          <div className="mb-5 flex items-center gap-3">
            <Palette className="text-amber-600" size={24} />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Website colors</h2>
              <p className="text-sm text-gray-500">Changes are applied across the public website.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ['primary', 'Primary color'],
              ['secondary', 'Secondary color'],
              ['accent', 'Accent color'],
              ['background', 'Page background'],
              ['text', 'Main text color'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-lg border p-3">
                <input type="color" value={theme[key]} onChange={(event) => setTheme((current) => ({ ...current, [key]: event.target.value }))} className="h-11 w-14 cursor-pointer rounded border-0 bg-transparent" />
                <span className="flex-1">
                  <span className="block text-sm font-medium text-gray-800">{label}</span>
                  <span className="text-xs uppercase text-gray-500">{theme[key]}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-md">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">Page images</h2>
            <p className="text-sm text-gray-500">Upload JPG, PNG, WEBP or AVIF files up to 5 MB. Room photos and team member portraits are managed in their own admin sections.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_SLOTS.map((slot) => (
              <div key={slot.key} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                  <ImageIcon size={16} className="text-amber-600" /> {slot.label}
                </div>
                <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-gray-100">
                  {pageImages[slot.key] ? (
                    <img src={pageImages[slot.key]} alt={slot.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">Default image is currently used</div>
                  )}
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100">
                  <UploadCloud size={16} /> {uploadingKey === slot.key ? 'Uploading...' : 'Choose image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploadingKey !== null} onChange={(event) => void uploadImage(slot.key, event)} className="sr-only" />
                </label>
                {pageImages[slot.key] && <button type="button" onClick={() => setPageImages((current) => { const next = { ...current }; delete next[slot.key]; return next; })} className="mt-2 w-full text-xs text-red-600 hover:underline">Use default image</button>}
              </div>
            ))}
          </div>
        </section>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={saving || uploadingKey !== null} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Website Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminWebsiteSettings;
