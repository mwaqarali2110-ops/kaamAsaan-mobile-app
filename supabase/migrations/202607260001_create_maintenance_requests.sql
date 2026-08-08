create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  reference_number text not null unique,
  plan_id text not null check (plan_id in ('essential', 'standard', 'premium')),
  plan_title text not null,
  plan_price numeric(12, 2) not null default 0 check (plan_price >= 0),
  frequency text not null,
  service_type text not null check (service_type in ('preventive_maintenance', 'solar_care')),
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  preferred_date text not null,
  preferred_time_slot text not null,
  notes text,
  status text not null default 'received' check (status in (
    'received', 'pending', 'submitted', 'pending_confirmation', 'scheduled', 'assigned',
    'in_progress', 'technician_arrived', 'completed', 'closed', 'cancelled'
  )),
  cancellation_reason text,
  cancellation_note text,
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by is null or cancelled_by in ('customer', 'admin', 'representative')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_maintenance_requests_user_created
on public.maintenance_requests(user_id, created_at desc);

create index if not exists idx_maintenance_requests_user_status
on public.maintenance_requests(user_id, status);

create or replace function public.set_maintenance_request_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists maintenance_requests_set_updated_at on public.maintenance_requests;
create trigger maintenance_requests_set_updated_at
before update on public.maintenance_requests
for each row execute function public.set_maintenance_request_updated_at();

alter table public.maintenance_requests enable row level security;

drop policy if exists "Customers can create own maintenance requests" on public.maintenance_requests;
drop policy if exists "Customers can view own maintenance requests" on public.maintenance_requests;

create policy "Customers can create own maintenance requests"
on public.maintenance_requests
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Customers can view own maintenance requests"
on public.maintenance_requests
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.cancel_maintenance_request(
  p_request_id uuid,
  p_cancellation_reason text default null,
  p_cancellation_note text default null
)
returns public.maintenance_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_request public.maintenance_requests;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  update public.maintenance_requests
  set
    status = 'cancelled',
    cancellation_reason = nullif(trim(p_cancellation_reason), ''),
    cancellation_note = nullif(trim(p_cancellation_note), ''),
    cancelled_at = now(),
    cancelled_by = 'customer'
  where id = p_request_id
    and user_id = auth.uid()
    and status in ('received', 'pending', 'submitted', 'pending_confirmation', 'scheduled')
  returning * into updated_request;

  if updated_request.id is null then
    if exists (
      select 1 from public.maintenance_requests
      where id = p_request_id and user_id = auth.uid()
    ) then
      raise exception 'This maintenance request can no longer be cancelled.';
    end if;
    raise exception 'Maintenance request was not found for this customer.';
  end if;

  return updated_request;
end;
$$;

revoke all on function public.cancel_maintenance_request(uuid, text, text) from public;
grant execute on function public.cancel_maintenance_request(uuid, text, text) to authenticated;

grant select, insert on table public.maintenance_requests to authenticated;
