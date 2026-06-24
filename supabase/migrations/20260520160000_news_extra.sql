-- 3 news aggiuntive dal prototype i18n.js

insert into public.news (category, venue, title, event_date, type, lang) values
  ('Press', '',      '18 Karati Black',       'Edizione monografica',     'press', 'it'),
  ('Fiera', 'Arezzo','Oroarezzo 2019',        '11 — 14 Maggio 2019',     'fiera', 'it'),
  ('Press', '',      'Oro Arezzo Magazine',   'Primavera 2018',           'press', 'it');

insert into public.news (category, venue, title, event_date, type, lang) values
  ('Press', '',      '18 Karati Black',       'Monographic issue',        'press', 'en'),
  ('Fair',  'Arezzo','Oroarezzo 2019',        'May 11 — 14, 2019',       'fiera', 'en'),
  ('Press', '',      'Oro Arezzo Magazine',   'Spring 2018',              'press', 'en');
