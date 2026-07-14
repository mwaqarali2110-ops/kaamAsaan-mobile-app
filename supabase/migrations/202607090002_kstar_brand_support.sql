-- KSTAR brand support for package inventory.
-- Safe to rerun.

begin;

insert into public.brands (name, slug, category, is_active)
values
  ('KSTAR', 'kstar-inverter', 'inverter', true),
  ('KSTAR', 'kstar-battery', 'battery', true)
on conflict (name, category) do update
set slug = excluded.slug,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.product_compatibility (
  inverter_brand_id,
  compatible_battery_brand_id,
  notes,
  is_active
)
select inverter.id,
       battery.id,
       'KSTAR inverter to KSTAR battery compatibility',
       true
from public.brands inverter
join public.brands battery
  on battery.name = 'KSTAR'
 and battery.category = 'battery'
where inverter.name = 'KSTAR'
  and inverter.category = 'inverter'
on conflict (inverter_brand_id, compatible_battery_brand_id) do update
set notes = excluded.notes,
    is_active = excluded.is_active,
    updated_at = now();

commit;
