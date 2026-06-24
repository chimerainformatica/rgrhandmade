-- Create gallery_images table
create table if not exists public.gallery_images (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  alt_text text,
  category text,
  status text not null default 'active' check (status in ('active', 'draft')),
  sort_order integer default 0,
  storage_path text not null,
  url text not null,
  width integer,
  height integer,
  size_bytes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes
create index if not exists gallery_images_category_idx on public.gallery_images (category);
create index if not exists gallery_images_sort_order_idx on public.gallery_images (sort_order);
create index if not exists gallery_images_status_idx on public.gallery_images (status);

-- Enable RLS
alter table public.gallery_images enable row level security;

-- Policy: Vitrix users can read active gallery images
drop policy if exists "Gallery read active images" on public.gallery_images;
create policy "Gallery read active images"
  on public.gallery_images for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read') and status = 'active');

-- Policy: Vitrix users with write permission can see all statuses (draft + active) for editing
drop policy if exists "Gallery edit see all" on public.gallery_images;
create policy "Gallery edit see all"
  on public.gallery_images for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.gallery.write'));

-- Policy: Create/update/delete images requires write permission
drop policy if exists "Gallery write images" on public.gallery_images;
create policy "Gallery write images"
  on public.gallery_images for all
  to authenticated
  using (public.vitrix_has_permission('vitrix.gallery.write'))
  with check (public.vitrix_has_permission('vitrix.gallery.write'));

-- Add permission vitrix.gallery.write if not exists
insert into public.vitrix_permissions (key, label)
values ('vitrix.gallery.write', 'Gestione gallery (upload, modifica, eliminazione)')
on conflict (key) do nothing;

-- Add gallery module entry if not exists
insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('gallery', 'Gallery', 'Gestione immagini del portfolio.', true, 4)
on conflict (id) do update
set enabled = true,
    description = 'Gestione immagini del portfolio.',
    updated_at = now();
