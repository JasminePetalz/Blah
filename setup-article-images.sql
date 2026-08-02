-- Run once in Supabase SQL Editor.
-- Creates a public bucket for article cover images and lets signed-in users
-- manage files only inside their own user-ID folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view article images" on storage.objects;
create policy "Public can view article images"
on storage.objects for select
using (bucket_id = 'article-images');

drop policy if exists "Users can upload their article images" on storage.objects;
create policy "Users can upload their article images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'article-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their article images" on storage.objects;
create policy "Users can update their article images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'article-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'article-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their article images" on storage.objects;
create policy "Users can delete their article images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'article-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
