create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  survey_booking_id uuid null references public.survey_bookings(id) on delete cascade,
  notification_key text not null,
  type text not null,
  title text not null,
  message text not null,
  action_type text null,
  action_value text null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (notification_key)
);

create index if not exists idx_notifications_user_created_at
on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
on public.notifications(user_id, is_read)
where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "Customers can insert own notifications" on public.notifications;
drop policy if exists "Customers can view own notifications" on public.notifications;
drop policy if exists "Customers can update own notifications" on public.notifications;

create policy "Customers can insert own notifications"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Customers can view own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

create policy "Customers can update own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
