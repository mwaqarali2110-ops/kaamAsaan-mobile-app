alter type public.booking_status add value if not exists 'assigned';
alter type public.booking_status add value if not exists 'scheduled';
alter type public.booking_status add value if not exists 'survey_in_progress';
alter type public.booking_status add value if not exists 'installation_started';
alter type public.booking_status add value if not exists 'cancelled';

alter table public.survey_bookings
  add column if not exists cancellation_reason text,
  add column if not exists cancellation_note text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text;

alter table public.survey_bookings
  drop constraint if exists survey_bookings_cancelled_by_check;

alter table public.survey_bookings
  add constraint survey_bookings_cancelled_by_check
  check (cancelled_by is null or cancelled_by in ('customer', 'admin', 'representative'));

drop policy if exists "Customers can cancel own active survey bookings" on public.survey_bookings;
drop policy if exists "Customers can cancel own survey booking" on public.survey_bookings;

create policy "Customers can cancel own survey booking"
on public.survey_bookings
for update
to authenticated
using (
  auth.uid() = user_id
  and status::text in ('pending', 'confirmed', 'assigned', 'scheduled', 'survey_scheduled')
)
with check (
  auth.uid() = user_id
  and status::text = 'cancelled'
  and cancelled_by = 'customer'
);

create or replace function public.cancel_survey_booking(
  p_booking_id uuid,
  p_cancellation_reason text,
  p_cancellation_note text default null
)
returns public.survey_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_booking public.survey_bookings;
begin
  if p_cancellation_reason is null or length(trim(p_cancellation_reason)) = 0 then
    raise exception 'Cancellation reason is required';
  end if;

  update public.survey_bookings
  set
    status = 'cancelled',
    cancellation_reason = trim(p_cancellation_reason),
    cancellation_note = nullif(trim(coalesce(p_cancellation_note, '')), ''),
    cancelled_at = now(),
    cancelled_by = 'customer',
    updated_at = now()
  where id = p_booking_id
    and user_id = auth.uid()
    and status::text in ('pending', 'confirmed', 'assigned', 'scheduled', 'survey_scheduled')
  returning * into updated_booking;

  if updated_booking.id is null then
    if exists (
      select 1
      from public.survey_bookings
      where id = p_booking_id
        and user_id = auth.uid()
    ) then
      raise exception 'This survey booking can no longer be cancelled because the survey process has already started.';
    end if;

    raise exception 'Survey booking was not found for this customer.';
  end if;

  return updated_booking;
end;
$$;

revoke all on function public.cancel_survey_booking(uuid, text, text) from public;
grant execute on function public.cancel_survey_booking(uuid, text, text) to authenticated;
