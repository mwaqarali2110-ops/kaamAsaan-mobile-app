alter table public.survey_bookings
enable row level security;

drop policy if exists "survey_bookings_own_update"
on public.survey_bookings;

create policy "survey_bookings_own_update"
on public.survey_bookings
for update
to authenticated
using (
  user_id = auth.uid()
  or private.is_admin()
)
with check (
  user_id = auth.uid()
  or private.is_admin()
);

grant update
on table public.survey_bookings
to authenticated;

notify pgrst, 'reload schema';
