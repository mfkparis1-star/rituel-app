-- Phase 16D Storage — post-images bucket for community post photos
--
-- Mirrors the avatars bucket pattern (Phase 16C M1):
--   - public read so the community feed can display images via public URL
--   - authenticated upload to own folder only
--     (storage.foldername(name))[1] must equal auth.uid()::text
--   - 5 MB cap (larger than avatars 2 MB, since posts can be wider crops)
--   - jpeg / png / webp allowed

-- ---- Bucket -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ---- Policies -----------------------------------------------------------
drop policy if exists "Post Image Public Read" on storage.objects;
create policy "Post Image Public Read"
  on storage.objects for select
  to public
  using (bucket_id = 'post-images');

drop policy if exists "Post Image User Upload" on storage.objects;
create policy "Post Image User Upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Post Image User Update" on storage.objects;
create policy "Post Image User Update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Post Image User Delete" on storage.objects;
create policy "Post Image User Delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
