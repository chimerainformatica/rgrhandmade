-- Aggiunge i moduli Vitrix oltre al dashboard già presente in vitrix_core.sql

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values
  ('collections', 'Collezioni',    'Gestione delle collezioni gioielli',      true,  1),
  ('press',       'Press & Fiere', 'Gestione delle presenze a fiere e press', true,  2),
  ('media',       'Media',         'Gestione file e immagini',                false, 3),
  ('settings',    'Impostazioni',  'Configurazione del sito',                 true,  4)
on conflict (id) do nothing;
