-- ============================================================
-- NATIONAL FIT — Bucket Storage pour les uploads (photos, etc.)
-- Exécuter une seule fois dans le SQL Editor Supabase
-- ============================================================

-- Créer le bucket public
insert into storage.buckets (id, name, public)
values ('nfit-uploads', 'nfit-uploads', true)
on conflict (id) do nothing;

-- Policy : les utilisateurs connectés peuvent uploader leurs propres fichiers
create policy "users can upload" on storage.objects
  for insert with check (
    bucket_id = 'nfit-uploads' and auth.role() = 'authenticated'
  );

-- Policy : tout le monde peut lire (images publiques)
create policy "public read" on storage.objects
  for select using (bucket_id = 'nfit-uploads');

-- Policy : les utilisateurs peuvent supprimer leurs propres fichiers
create policy "users can delete own files" on storage.objects
  for delete using (
    bucket_id = 'nfit-uploads' and auth.uid()::text = (storage.foldername(name))[1]
  );
