-- Room image storage and editable demo inventory.
-- Safe to re-run: the bucket is upserted and demo rows are inserted only when absent.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-images',
  'room-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view room images" on storage.objects;
create policy "Public can view room images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'room-images');

drop policy if exists "Admins can upload room images" on storage.objects;
create policy "Admins can upload room images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'room-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins can update room images" on storage.objects;
create policy "Admins can update room images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'room-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'room-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins can delete room images" on storage.objects;
create policy "Admins can delete room images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'room-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

insert into public.rooms
  (name, description, price_per_night, capacity, total_inventory, size_sqft, room_type, amenities, images, is_active)
select v.name, v.description, v.price_per_night, v.capacity, v.total_inventory, v.size_sqft,
       v.room_type, v.amenities::jsonb, v.images::jsonb, true
from (values
  (
    'Garden View Double Room',
    'A bright double room overlooking the hotel garden, with a comfortable queen bed and a quiet sitting corner.',
    9500.00, 2, 2, 310, 'deluxe',
    '["Free WiFi","Air Conditioning","Queen Bed","Garden View","Private Bathroom","Tea and Coffee"]',
    '["https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1000"]'
  ),
  (
    'Himalayan Family Room',
    'A generous family room with flexible sleeping space, warm natural finishes and room for everyone to relax.',
    14500.00, 4, 2, 460, 'suite',
    '["Free WiFi","Air Conditioning","Family Beds","Smart TV","Private Bathroom","Mountain View"]',
    '["https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1000"]'
  ),
  (
    'Heritage Premium Suite',
    'A premium suite inspired by traditional Kathmandu craftsmanship, featuring a separate lounge and upgraded amenities.',
    18500.00, 3, 1, 520, 'suite',
    '["Free WiFi","King Bed","Separate Lounge","Smart TV","Mini Bar","Premium Bathroom","Breakfast Included"]',
    '["https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?auto=compress&cs=tinysrgb&w=1000"]'
  )
) as v(name, description, price_per_night, capacity, total_inventory, size_sqft, room_type, amenities, images)
where not exists (
  select 1 from public.rooms existing where existing.name = v.name
);
