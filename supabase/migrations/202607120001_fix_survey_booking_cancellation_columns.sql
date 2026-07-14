alter table public.survey_bookings
  add column if not exists cancellation_reason text,
  add column if not exists cancellation_note text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text,
  add column if not exists updated_at timestamptz default now();

comment on column public.survey_bookings.cancellation_reason
is 'Reason selected by the customer or admin when cancelling a survey booking';

comment on column public.survey_bookings.cancellation_note
is 'Optional detailed cancellation note, especially when Other is selected';

comment on column public.survey_bookings.cancelled_at
is 'Timestamp when the survey booking was cancelled';

comment on column public.survey_bookings.cancelled_by
is 'Actor who cancelled the booking, such as customer or admin';

alter type public.booking_status add value if not exists 'cancelled';

alter table public.survey_bookings
  drop constraint if exists survey_bookings_cancelled_by_check;

alter table public.survey_bookings
  add constraint survey_bookings_cancelled_by_check
  check (cancelled_by is null or cancelled_by in ('customer', 'admin', 'representative'));

notify pgrst, 'reload schema';

-- Verification query. All five rows must be returned after this migration is applied.
-- select
--   column_name,
--   data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'survey_bookings'
--   and column_name in (
--     'cancellation_reason',
--     'cancellation_note',
--     'cancelled_at',
--     'cancelled_by',
--     'updated_at'
--   )
-- order by column_name;
