-- Jalankan script ini di Supabase > SQL Editor.
-- Tabel menu_items Anda sudah terdeteksi berhasil dibuat.

alter table menu_items enable row level security;

drop policy if exists "Public can read menus" on menu_items;
create policy "Public can read menus"
on menu_items for select
using (true);

drop policy if exists "Authenticated users can manage menus" on menu_items;
create policy "Authenticated users can manage menus"
on menu_items for all
to authenticated
using (true)
with check (true);

create table if not exists site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz default now()
);

alter table site_content enable row level security;

drop policy if exists "Public can read CMS" on site_content;
create policy "Public can read CMS"
on site_content for select
using (true);

drop policy if exists "Admin can manage CMS" on site_content;
create policy "Admin can manage CMS"
on site_content for all
to authenticated
using (true)
with check (true);

-- Pastikan bucket Storage bernama menu-images dan bersifat Public.
-- Bagian berikut memberi izin baca publik dan upload hanya untuk user login.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read menu images" on storage.objects;
create policy "Public can read menu images"
on storage.objects for select
using (bucket_id = 'menu-images');

drop policy if exists "Authenticated users can upload menu images" on storage.objects;
create policy "Authenticated users can upload menu images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'menu-images');

drop policy if exists "Authenticated users can update menu images" on storage.objects;
create policy "Authenticated users can update menu images"
on storage.objects for update
to authenticated
using (bucket_id = 'menu-images')
with check (bucket_id = 'menu-images');

drop policy if exists "Authenticated users can delete menu images" on storage.objects;
create policy "Authenticated users can delete menu images"
on storage.objects for delete
to authenticated
using (bucket_id = 'menu-images');

-- Jangan menaruh service_role key di frontend.