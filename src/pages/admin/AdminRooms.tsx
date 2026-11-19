import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Plus, Edit, Trash2, Search, ImagePlus, X, UploadCloud, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Room } from '../../types';

type RoomFormState = {
  name: string;
  description: string;
  price_per_night: string;
  capacity: string;
  total_inventory: string;
  size_sqft: string;
  room_type: Room['room_type'];
  amenities: string;
  imageUrls: string;
  is_active: boolean;
};

const createEmptyForm = (): RoomFormState => ({
  name: '',
  description: '',
  price_per_night: '',
  capacity: '2',
  total_inventory: '1',
  size_sqft: '',
  room_type: 'standard',
  amenities: '',
  imageUrls: '',
  is_active: true,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES_PER_ROOM = 8;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const STORAGE_BUCKET = 'room-images';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred. Please try again.';
}

function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<RoomFormState>(createEmptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    void fetchRooms();
  }, []);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const fetchRooms = async () => {
    setLoading(true);
    setPageError('');
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRooms((data ?? []) as Room[]);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(createEmptyForm());
    setSelectedFiles([]);
    setFormError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    resetForm();
  };

  const openNewRoom = () => {
    resetForm();
    setEditingRoom(null);
    setShowModal(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description,
      price_per_night: String(room.price_per_night),
      capacity: String(room.capacity),
      total_inventory: String(room.total_inventory),
      size_sqft: room.size_sqft == null ? '' : String(room.size_sqft),
      room_type: room.room_type,
      amenities: (room.amenities ?? []).join(', '),
      imageUrls: (room.images ?? []).join('\n'),
      is_active: room.is_active,
    });
    setSelectedFiles([]);
    setFormError('');
    setShowModal(true);
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const currentUrlCount = formData.imageUrls.split(/\r?\n/).filter((url) => url.trim()).length;
    if (currentUrlCount + selectedFiles.length + files.length > MAX_IMAGES_PER_ROOM) {
      setFormError('A room can have up to ' + MAX_IMAGES_PER_ROOM + ' images.');
      return;
    }

    const invalidFile = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE);
    if (invalidFile) {
      setFormError(invalidFile.name + ' is not supported. Choose JPG, PNG, WEBP or AVIF images up to 5 MB each.');
      return;
    }

    setFormError('');
    setSelectedFiles((current) => [...current, ...files]);
  };

  const ensureAdminSession = async (): Promise<string> => {
    // Refresh the JWT before privileged operations so recently assigned app_metadata
    // roles are reflected in the token evaluated by Supabase RLS policies.
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) {
      throw new Error('Your admin session has expired. Please sign out and sign in again.');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (!userData.user || userData.user.app_metadata?.role !== 'admin') {
      throw new Error('This account does not have administrator access. Sign in with an authorized admin account.');
    }

    return userData.user.id;
  };

  const uploadSelectedImages = async (userId: string): Promise<{ urls: string[]; paths: string[] }> => {
    const urls: string[] = [];
    const paths: string[] = [];

    for (const file of selectedFiles) {
      const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
      const path = userId + '/' + crypto.randomUUID() + '-' + safeName;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;

      paths.push(path);
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return { urls, paths };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const price = Number(formData.price_per_night);
    const capacity = Number(formData.capacity);
    const inventory = Number(formData.total_inventory);
    const size = formData.size_sqft.trim() ? Number(formData.size_sqft) : null;
    const imageUrls = formData.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);

    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Enter a valid room price greater than zero.');
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setFormError('Guest capacity must be at least 1.');
      return;
    }
    if (!Number.isInteger(inventory) || inventory < 1) {
      setFormError('Room inventory must be at least 1.');
      return;
    }
    if (size !== null && (!Number.isInteger(size) || size < 1)) {
      setFormError('Room size must be a positive whole number.');
      return;
    }
    if (imageUrls.length + selectedFiles.length > MAX_IMAGES_PER_ROOM) {
      setFormError('A room can have up to ' + MAX_IMAGES_PER_ROOM + ' images.');
      return;
    }

    setSaving(true);
    let uploadedPaths: string[] = [];
    try {
      const userId = await ensureAdminSession();
      const uploaded = await uploadSelectedImages(userId);
      uploadedPaths = uploaded.paths;

      const roomData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price_per_night: price,
        capacity,
        total_inventory: inventory,
        size_sqft: size,
        room_type: formData.room_type,
        amenities: formData.amenities.split(',').map((item) => item.trim()).filter(Boolean),
        images: [...imageUrls, ...uploaded.urls],
        is_active: formData.is_active,
      };

      if (editingRoom) {
        const { error } = await supabase.from('rooms')
          .update({ ...roomData, updated_at: new Date().toISOString() })
          .eq('id', editingRoom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('rooms').insert([roomData]);
        if (error) throw error;
      }

      closeModal();
      await fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths);
        if (cleanupError) console.error('Could not clean up uploaded room images:', cleanupError);
      }
      const message = getErrorMessage(error);
      setFormError(
        message.includes('JWT') || message.includes('token') || message.includes('Unauthorized')
          ? message + ' If the problem continues, sign out and sign in again.'
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!window.confirm('Delete "' + room.name + '"? This cannot be undone.')) return;
    setDeletingId(room.id);
    setPageError('');
    try {
      await ensureAdminSession();
      const { error } = await supabase.from('rooms').delete().eq('id', room.id);
      if (error) throw error;
      setRooms((current) => current.filter((item) => item.id !== room.id));
    } catch (error) {
      console.error('Error deleting room:', error);
      setPageError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentImageUrls = formData.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600">Manage room details, photos, prices and inventory.</p>
        </div>
        <button type="button" onClick={openNewRoom} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 font-medium text-white transition hover:from-amber-700 hover:to-amber-800">
          <Plus size={19} /> Add Room
        </button>
      </div>

      {pageError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{pageError}</span>
          <button type="button" onClick={() => void fetchRooms()} className="shrink-0 font-semibold underline">Retry</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <div className="border-b p-4">
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
            <Search size={19} className="text-gray-400" />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search rooms by name or type..." className="min-w-0 flex-1 bg-transparent outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500"><RefreshCw className="mx-auto mb-3 animate-spin" size={24} />Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-10 text-center">
            <ImagePlus className="mx-auto mb-3 text-gray-400" size={34} />
            <h2 className="font-semibold text-gray-800">{searchTerm ? 'No matching rooms' : 'No rooms added yet'}</h2>
            <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try another search term.' : 'Add a room or use the sample rooms supplied with the project.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Price / night</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {room.images?.[0] ? <img src={room.images[0]} alt={room.name} className="h-12 w-14 rounded-lg object-cover" /> : <div className="flex h-12 w-14 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><ImagePlus size={20} /></div>}
                        <div>
                          <div className="font-medium text-gray-900">{room.name}</div>
                          <div className="text-sm text-gray-500">{room.capacity} guests · {room.images?.length ?? 0} photos</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-700">{room.room_type}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">रु. {Number(room.price_per_night).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-gray-700">{room.total_inventory}</td>
                    <td className="px-6 py-4"><span className={room.is_active ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700' : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600'}>{room.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => handleEdit(room)} aria-label={'Edit ' + room.name} className="mr-3 inline-flex text-amber-600 hover:text-amber-800"><Edit size={18} /></button>
                      <button type="button" onClick={() => void handleDelete(room)} disabled={deletingId === room.id} aria-label={'Delete ' + room.name} className="inline-flex text-red-600 hover:text-red-800 disabled:opacity-50">
                        {deletingId === room.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
                <p className="text-sm text-gray-500">Fields marked * are required.</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close form" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="room-name" className="mb-1 block text-sm font-medium text-gray-700">Room name *</label>
                  <input id="room-name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required maxLength={100} className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="room-description" className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
                  <textarea id="room-description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} required rows={3} maxLength={2000} className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div>
                  <label htmlFor="room-price" className="mb-1 block text-sm font-medium text-gray-700">Price per night (NPR) *</label>
                  <input id="room-price" type="number" min="1" step="0.01" value={formData.price_per_night} onChange={(event) => setFormData({ ...formData, price_per_night: event.target.value })} required className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div>
                  <label htmlFor="room-type" className="mb-1 block text-sm font-medium text-gray-700">Room type *</label>
                  <select id="room-type" value={formData.room_type} onChange={(event) => setFormData({ ...formData, room_type: event.target.value as Room['room_type'] })} className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100">
                    <option value="standard">Standard</option><option value="deluxe">Deluxe</option><option value="suite">Suite</option><option value="penthouse">Penthouse</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="room-capacity" className="mb-1 block text-sm font-medium text-gray-700">Guest capacity *</label>
                  <input id="room-capacity" type="number" min="1" step="1" value={formData.capacity} onChange={(event) => setFormData({ ...formData, capacity: event.target.value })} required className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div>
                  <label htmlFor="room-inventory" className="mb-1 block text-sm font-medium text-gray-700">Total room inventory *</label>
                  <input id="room-inventory" type="number" min="1" step="1" value={formData.total_inventory} onChange={(event) => setFormData({ ...formData, total_inventory: event.target.value })} required className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div>
                  <label htmlFor="room-size" className="mb-1 block text-sm font-medium text-gray-700">Size (sq ft)</label>
                  <input id="room-size" type="number" min="1" step="1" value={formData.size_sqft} onChange={(event) => setFormData({ ...formData, size_sqft: event.target.value })} className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div>
                  <label htmlFor="room-status" className="mb-1 block text-sm font-medium text-gray-700">Visibility</label>
                  <select id="room-status" value={formData.is_active ? 'active' : 'inactive'} onChange={(event) => setFormData({ ...formData, is_active: event.target.value === 'active' })} className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100">
                    <option value="active">Visible on website</option><option value="inactive">Hidden from website</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="room-amenities" className="mb-1 block text-sm font-medium text-gray-700">Amenities (comma-separated)</label>
                  <input id="room-amenities" value={formData.amenities} onChange={(event) => setFormData({ ...formData, amenities: event.target.value })} placeholder="WiFi, Air Conditioning, TV" className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="room-image-urls" className="mb-1 block text-sm font-medium text-gray-700">Image URLs (one URL per line)</label>
                  <textarea id="room-image-urls" value={formData.imageUrls} onChange={(event) => setFormData({ ...formData, imageUrls: event.target.value })} rows={3} placeholder="https://example.com/room-photo.jpg" className="w-full rounded-lg border px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="room-image-files" className="mb-2 block text-sm font-medium text-gray-700">Upload photos from your device</label>
                  <label htmlFor="room-image-files" className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-5 py-6 text-center transition hover:bg-amber-50">
                    <UploadCloud className="mb-2 text-amber-700" size={28} />
                    <span className="font-medium text-gray-800">Choose photos</span>
                    <span className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP or AVIF · up to 5 MB each · max {MAX_IMAGES_PER_ROOM} photos</span>
                    <input id="room-image-files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleFileSelection} className="sr-only" />
                  </label>

                  {(currentImageUrls.length > 0 || previewUrls.length > 0) && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {currentImageUrls.map((url, index) => (
                        <div key={url + '-' + index} className="relative">
                          <img src={url} alt={'Room photo ' + (index + 1)} className="h-24 w-full rounded-lg border object-cover" />
                          <button type="button" onClick={() => setFormData((current) => ({ ...current, imageUrls: current.imageUrls.split(/\r?\n/).filter((_, itemIndex) => itemIndex !== index).join('\n') }))} aria-label={'Remove image ' + (index + 1)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"><X size={14} /></button>
                        </div>
                      ))}
                      {previewUrls.map((url, index) => (
                        <div key={url + '-' + index} className="relative">
                          <img src={url} alt={'New photo ' + (index + 1)} className="h-24 w-full rounded-lg border object-cover" />
                          <button type="button" onClick={() => setSelectedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={'Remove selected photo ' + (index + 1)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"><X size={14} /></button>
                          <span className="mt-1 block truncate text-xs text-gray-500">{selectedFiles[index]?.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2.5 font-semibold text-white hover:from-amber-700 hover:to-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <><RefreshCw size={17} className="animate-spin" /> Saving room...</> : editingRoom ? 'Save changes' : 'Create room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRooms;
