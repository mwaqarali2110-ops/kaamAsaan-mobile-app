create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  complaint_type text not null,
  subject text not null,
  details text not null,
  reference_number text null,
  contact_number text not null,
  image_url text null,
  status text not null default 'pending',
  admin_response text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_complaints_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complaints_set_updated_at on public.complaints;

create trigger complaints_set_updated_at
before update on public.complaints
for each row
execute function public.set_complaints_updated_at();

alter table public.complaints enable row level security;

drop policy if exists "Customers can insert complaints" on public.complaints;
drop policy if exists "Customers can view their complaints" on public.complaints;
drop policy if exists "Admins can view complaints" on public.complaints;
drop policy if exists "Admins can update complaints" on public.complaints;

create policy "Customers can insert complaints"
on public.complaints
for insert
to authenticated
with check (auth.uid() = user_id or user_id is null);

create policy "Customers can view their complaints"
on public.complaints
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view complaints"
on public.complaints
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or (auth.jwt() ->> 'role') = 'service_role'
);

create policy "Admins can update complaints"
on public.complaints
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or (auth.jwt() ->> 'role') = 'service_role'
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or (auth.jwt() ->> 'role') = 'service_role'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-attachments',
  'complaint-attachments',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Customers can upload complaint attachments" on storage.objects;
drop policy if exists "Customers can view complaint attachments" on storage.objects;

create policy "Customers can upload complaint attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'complaint-attachments'
  and (storage.foldername(name))[1] = 'complaints'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Customers can view complaint attachments"
on storage.objects
for select
to authenticated
using (bucket_id = 'complaint-attachments');
