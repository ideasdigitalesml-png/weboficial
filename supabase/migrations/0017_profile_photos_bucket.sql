-- Public bucket for profile photos uploaded directly from the onboarding
-- wizard's image field (replaces the old stock-photo gallery -- see
-- FieldInput.tsx's ImageFieldInput). Public because the photo is shown on
-- the professional's public landing page, same visibility as the rest of
-- their form_data.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Allow anyone to upload (authenticated users during onboarding)
create policy "Authenticated users can upload profile photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-photos');

-- Allow public read
create policy "Public read profile photos"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-photos');
