-- =============================================================================
-- RGR Handmade · Initial Schema
-- Applicare via Supabase Dashboard → SQL Editor
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELLE PUBBLICHE
-- ----------------------------------------------------------------------------

create table public.collections (
  id          bigint primary key generated always as identity,
  ref         text    not null,
  title       text    not null,
  description text,
  category    text    not null,
  img_path    text,
  img_position text   default '50% 50%',
  lang        text    not null default 'it',
  status      text    not null default 'published'
                check (status in ('draft', 'published')),
  sort_order  integer not null default 0,
  created_at  timestamptz default now()
);

create table public.news (
  id          bigint primary key generated always as identity,
  category    text    not null,
  venue       text,
  title       text    not null,
  event_date  text,
  type        text    not null check (type in ('fiera', 'press')),
  lang        text    not null default 'it',
  status      text    not null default 'published'
                check (status in ('draft', 'published')),
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 2. TABELLE VITRIX (backoffice)
-- ----------------------------------------------------------------------------

create table public.vitrix_modules (
  id          text    primary key,
  label       text    not null,
  description text,
  enabled     boolean not null default true,
  sort_order  integer not null default 0
);

create table public.vitrix_roles (
  id    text primary key,
  name  text not null unique
          check (name in ('owner', 'admin', 'editor', 'viewer')),
  label text not null
);

create table public.vitrix_permissions (
  id    text primary key,
  key   text not null unique,
  label text not null
);

create table public.vitrix_role_permissions (
  role_id       text references public.vitrix_roles(id) on delete cascade,
  permission_id text references public.vitrix_permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.vitrix_user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_id text references public.vitrix_roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.collections          enable row level security;
alter table public.news                 enable row level security;
alter table public.vitrix_modules       enable row level security;
alter table public.vitrix_roles         enable row level security;
alter table public.vitrix_permissions   enable row level security;
alter table public.vitrix_role_permissions enable row level security;
alter table public.vitrix_user_roles    enable row level security;

-- Contenuto pubblico: chiunque legge le righe pubblicate
create policy "public read collections"
  on public.collections for select
  using (status = 'published');

create policy "public read news"
  on public.news for select
  using (status = 'published');

-- Vitrix: solo utenti autenticati leggono; le scritture passano via service role
create policy "auth read vitrix_modules"
  on public.vitrix_modules for select to authenticated using (true);

create policy "auth read vitrix_roles"
  on public.vitrix_roles for select to authenticated using (true);

create policy "auth read vitrix_permissions"
  on public.vitrix_permissions for select to authenticated using (true);

create policy "auth read vitrix_role_permissions"
  on public.vitrix_role_permissions for select to authenticated using (true);

create policy "auth read vitrix_user_roles"
  on public.vitrix_user_roles for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- 4. SEED — COLLEZIONI (IT)
-- ----------------------------------------------------------------------------

insert into public.collections (ref, title, description, category, img_path, img_position, lang, sort_order) values
  ('Nº 016', 'Filigrana',  'Oro 18kt · pietre dure',       'Collane',    'hero-1.png', '70% 80%', 'it', 1),
  ('Nº 014', 'Trame',      'Argento 925 · brunito',         'Bracciali',  'hero-2.png', '78% 50%', 'it', 2),
  ('Nº 011', 'Sfere',      'Oro champagne · perle',         'Collane',    'hero-3.png', '72% 35%', 'it', 3),
  ('Nº 008', 'Onda',       'Oro 18kt · diamanti',           'Anelli',     'hero-4.png', '72% 45%', 'it', 4),
  ('Nº 005', 'Foglia',     'Argento · finitura satinata',   'Orecchini',  'hero-1.png', '44% 60%', 'it', 5),
  ('Nº 002', 'Notte',      'Oro brunito · zaffiri',         'Anelli',     'hero-2.png', '55% 60%', 'it', 6);

-- SEED — COLLEZIONI (EN)
insert into public.collections (ref, title, description, category, img_path, img_position, lang, sort_order) values
  ('Nº 016', 'Filigree',   '18kt gold · hard stones',      'Collane',    'hero-1.png', '70% 80%', 'en', 1),
  ('Nº 014', 'Weaves',     'Sterling silver · burnished',   'Bracciali',  'hero-2.png', '78% 50%', 'en', 2),
  ('Nº 011', 'Spheres',    'Champagne gold · pearls',       'Collane',    'hero-3.png', '72% 35%', 'en', 3),
  ('Nº 008', 'Wave',       '18kt gold · diamonds',          'Anelli',     'hero-4.png', '72% 45%', 'en', 4),
  ('Nº 005', 'Leaf',       'Silver · satin finish',         'Orecchini',  'hero-1.png', '44% 60%', 'en', 5),
  ('Nº 002', 'Notte',      'Burnished gold · sapphires',    'Anelli',     'hero-2.png', '55% 60%', 'en', 6);

-- ----------------------------------------------------------------------------
-- 5. SEED — NEWS (IT + EN)
-- ----------------------------------------------------------------------------

insert into public.news (category, venue, title, event_date, type, lang) values
  ('Fiera', 'Vicenza',          'VicenzaOro January 2020',  '16 - 22 Gennaio 2020',   'fiera', 'it'),
  ('Press', 'Gold/Italy',       'October 2019',             '5 - 8 Ottobre 2019',     'press', 'it'),
  ('Press', 'Shine and Passion','Numero speciale',           'Edizione monografica',   'press', 'it'),
  ('Fiera', 'Istanbul',         'Istanbul Jewelry Show',    'Marzo 2016',             'fiera', 'it');

insert into public.news (category, venue, title, event_date, type, lang) values
  ('Fair',  'Vicenza',          'VicenzaOro January 2020',  'Jan 16 - 22, 2020',      'fiera', 'en'),
  ('Press', 'Gold/Italy',       'October 2019',             'Oct 5 - 8, 2019',        'press', 'en'),
  ('Press', 'Shine and Passion','Special edition',           'Monographic issue',      'press', 'en'),
  ('Fair',  'Istanbul',         'Istanbul Jewelry Show',    'March 2016',             'fiera', 'en');

-- ----------------------------------------------------------------------------
-- 6. SEED — VITRIX CORE
-- ----------------------------------------------------------------------------

insert into public.vitrix_roles (id, name, label) values
  ('owner',  'owner',  'Owner'),
  ('admin',  'admin',  'Amministratore'),
  ('editor', 'editor', 'Editor'),
  ('viewer', 'viewer', 'Viewer');

insert into public.vitrix_permissions (id, key, label) values
  ('vitrix.read',               'vitrix.read',               'Accesso al pannello Vitrix'),
  ('vitrix.collections.read',   'vitrix.collections.read',   'Visualizza collezioni'),
  ('vitrix.collections.write',  'vitrix.collections.write',  'Modifica collezioni'),
  ('vitrix.press.read',         'vitrix.press.read',         'Visualizza press'),
  ('vitrix.press.write',        'vitrix.press.write',        'Modifica press'),
  ('vitrix.users.read',         'vitrix.users.read',         'Visualizza utenti'),
  ('vitrix.users.write',        'vitrix.users.write',        'Gestione utenti');

insert into public.vitrix_role_permissions (role_id, permission_id) values
  ('owner',  'vitrix.read'),
  ('owner',  'vitrix.collections.read'),
  ('owner',  'vitrix.collections.write'),
  ('owner',  'vitrix.press.read'),
  ('owner',  'vitrix.press.write'),
  ('owner',  'vitrix.users.read'),
  ('owner',  'vitrix.users.write'),
  ('admin',  'vitrix.read'),
  ('admin',  'vitrix.collections.read'),
  ('admin',  'vitrix.collections.write'),
  ('admin',  'vitrix.press.read'),
  ('admin',  'vitrix.press.write'),
  ('admin',  'vitrix.users.read'),
  ('editor', 'vitrix.read'),
  ('editor', 'vitrix.collections.read'),
  ('editor', 'vitrix.collections.write'),
  ('editor', 'vitrix.press.read'),
  ('editor', 'vitrix.press.write'),
  ('viewer', 'vitrix.read'),
  ('viewer', 'vitrix.collections.read'),
  ('viewer', 'vitrix.press.read');

insert into public.vitrix_modules (id, label, description, enabled, sort_order) values
  ('dashboard',   'Dashboard',      'Panoramica del sito e stato connessione',       true,  0),
  ('collections', 'Collezioni',     'Gestione delle collezioni gioielli',            true,  1),
  ('press',       'Press & Fiere',  'Gestione delle presenze a fiere e press',       true,  2),
  ('media',       'Media',          'Gestione file e immagini',                      false, 3),
  ('settings',    'Impostazioni',   'Configurazione del sito',                       false, 4);
