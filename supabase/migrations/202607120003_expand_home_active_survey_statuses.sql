alter type public.booking_status add value if not exists 'design_in_progress';
alter type public.booking_status add value if not exists 'quotation_ready';
alter type public.booking_status add value if not exists 'installation_scheduled';

notify pgrst, 'reload schema';
