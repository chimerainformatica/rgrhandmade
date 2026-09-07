insert into public.vitrix_modules (id, label, description, enabled, sort_order)
values ('users', 'Utenti', 'Gestione account, ruoli e stato di accesso.', true, 30)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  enabled = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.vitrix_permissions (key, label)
values ('users.manage', 'Gestione utenti, ruoli e stato di accesso')
on conflict (key) do update set label = excluded.label;

delete from public.vitrix_role_permissions rp
using public.vitrix_permissions p, public.vitrix_roles r
where rp.permission_id = p.id
  and rp.role_id = r.id
  and p.key = 'users.manage'
  and r.name not in ('owner', 'superadmin');

insert into public.vitrix_role_permissions (role_id, permission_id)
select r.id, p.id
from public.vitrix_roles r
join public.vitrix_permissions p on p.key = 'users.manage'
where r.name in ('owner', 'superadmin')
on conflict do nothing;

create or replace function public.vitrix_set_single_user_role(
  p_user_id uuid,
  p_role_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role_id uuid;
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Utente non trovato.';
  end if;

  delete from public.vitrix_user_roles where user_id = p_user_id;

  if p_role_name is null then
    return;
  end if;

  select id into selected_role_id
  from public.vitrix_roles
  where name = p_role_name;

  if selected_role_id is null then
    raise exception 'Ruolo non valido.';
  end if;

  insert into public.vitrix_user_roles (user_id, role_id)
  values (p_user_id, selected_role_id);
end;
$$;

revoke all on function public.vitrix_set_single_user_role(uuid, text) from public, anon, authenticated;
grant execute on function public.vitrix_set_single_user_role(uuid, text) to service_role;
