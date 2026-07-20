-- Stores only a salted hash of the requester IP and expires each rolling window.
create table if not exists public.contact_form_rate_limits (
  client_hash text primary key,
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.contact_form_rate_limits enable row level security;

revoke all on table public.contact_form_rate_limits from anon, authenticated;

create or replace function public.consume_contact_form_rate_limit(
  p_client_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  rate_limit public.contact_form_rate_limits%rowtype;
  now_at timestamptz := now();
begin
  if length(p_client_hash) <> 64 or p_max_requests < 1 or p_window_seconds < 1 then
    raise exception 'Invalid contact form rate-limit input';
  end if;

  delete from public.contact_form_rate_limits
  where expires_at < now_at - interval '1 day';

  select * into rate_limit
  from public.contact_form_rate_limits
  where client_hash = p_client_hash
  for update;

  if not found or rate_limit.expires_at <= now_at then
    insert into public.contact_form_rate_limits (client_hash, request_count, window_started_at, expires_at)
    values (p_client_hash, 1, now_at, now_at + make_interval(secs => p_window_seconds))
    on conflict (client_hash) do update
      set request_count = 1,
          window_started_at = excluded.window_started_at,
          expires_at = excluded.expires_at;
    return query select true, 0;
    return;
  end if;

  if rate_limit.request_count < p_max_requests then
    update public.contact_form_rate_limits
    set request_count = request_count + 1
    where client_hash = p_client_hash;
    return query select true, 0;
    return;
  end if;

  return query select false, greatest(1, ceil(extract(epoch from rate_limit.expires_at - now_at))::integer);
end;
$$;

revoke all on function public.consume_contact_form_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_contact_form_rate_limit(text, integer, integer) to service_role;
