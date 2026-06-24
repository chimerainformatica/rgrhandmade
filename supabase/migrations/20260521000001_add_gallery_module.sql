-- Aggiunge il modulo Gallery ai moduli Vitrix

insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('gallery', 'Gallery', 'Gestione immagini del portfolio', true, 3)
on conflict (id) do update set enabled = true;
