-- Políticas de acceso para el bucket 'quotes-pdfs' en Supabase Storage
-- Permite lectura pública y gestión total para usuarios autenticados

-- 1. Permitir lectura pública (anónima)
create policy "Public read access to quotes-pdfs"
on storage.objects
for select
using (
  bucket_id = 'quotes-pdfs'
);

-- 2. Permitir subida a cualquier usuario autenticado
create policy "Authenticated upload to quotes-pdfs"
on storage.objects
for insert
with check (
  bucket_id = 'quotes-pdfs'
);

-- 3. Permitir borrado a cualquier usuario autenticado
create policy "Authenticated delete from quotes-pdfs"
on storage.objects
for delete
using (
  bucket_id = 'quotes-pdfs'
);

-- 4. Permitir sobrescritura a cualquier usuario autenticado
create policy "Authenticated update to quotes-pdfs"
on storage.objects
for update
using (
  bucket_id = 'quotes-pdfs'
); 