create table if not exists public.vitrix_site_settings (
  id text primary key default 'global',
  site_name text not null,
  seo_title text not null,
  seo_description text not null,
  canonical_url text not null,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  og_title text not null,
  og_description text not null,
  og_image text,
  favicon_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vitrix_site_settings enable row level security;

drop policy if exists "Vitrix read site settings" on public.vitrix_site_settings;
create policy "Vitrix read site settings"
  on public.vitrix_site_settings for select
  to authenticated
  using (public.vitrix_has_permission('vitrix.read'));

drop policy if exists "Vitrix manage site settings" on public.vitrix_site_settings;
create policy "Vitrix manage site settings"
  on public.vitrix_site_settings for all
  to authenticated
  using (public.vitrix_has_permission('vitrix.settings.manage'))
  with check (public.vitrix_has_permission('vitrix.settings.manage'));

insert into public.vitrix_site_settings (
  id,
  site_name,
  seo_title,
  seo_description,
  canonical_url,
  robots_index,
  robots_follow,
  og_title,
  og_description,
  og_image,
  favicon_path
)
values (
  'global',
  'R.G.R. Handmade',
  'R.G.R. Handmade',
  'Atelier orafo artigianale ad Arezzo dal 1989. Gioielli handmade in oro e argento, filo avvolto su sagoma.',
  'https://www.rgrhandmade.it',
  true,
  true,
  'R.G.R. Handmade',
  'Atelier orafo artigianale ad Arezzo dal 1989. Gioielli handmade in oro e argento, filo avvolto su sagoma.',
  '/assets/rgr/hero-1.png',
  '/favicon.ico'
)
on conflict (id) do nothing;

update public.vitrix_modules
set enabled = true,
    description = 'SEO, favicon, cache e log tecnici del sito.',
    updated_at = now()
where id = 'settings';
