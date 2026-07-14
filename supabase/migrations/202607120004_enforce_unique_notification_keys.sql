do $$
begin
  if to_regclass('public.notifications') is null then
    return;
  end if;

  delete from public.notifications
  where id in (
    select id
    from (
      select
        id,
        row_number() over (
          partition by notification_key
          order by created_at desc, id desc
        ) as duplicate_rank
      from public.notifications
    ) ranked
    where duplicate_rank > 1
  );

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.notifications'::regclass
      and conname = 'notifications_notification_key_key'
  ) then
    alter table public.notifications
      add constraint notifications_notification_key_key unique (notification_key);
  end if;
end $$;

notify pgrst, 'reload schema';
