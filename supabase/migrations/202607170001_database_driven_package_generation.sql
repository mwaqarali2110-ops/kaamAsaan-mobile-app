-- Database-driven package generation metadata.
-- This migration evolves the existing catalog in place and preserves products, prices and images.

begin;

alter table public.brands
  alter column category drop not null,
  add column if not exists aliases text[] not null default '{}'::text[],
  add column if not exists package_generation_enabled boolean not null default true,
  add column if not exists default_compatibility_group text,
  add column if not exists package_image_url text,
  add column if not exists priority integer not null default 0,
  add column if not exists canonical_slug text;

update public.brands
set canonical_slug = lower(regexp_replace(coalesce(nullif(slug, ''), name), '[^a-zA-Z0-9]+', '', 'g'))
where canonical_slug is null or canonical_slug = '';

update public.brands b
set
  aliases = case lower(regexp_replace(b.name, '[^a-zA-Z0-9]+', '', 'g'))
    when 'goodwe' then array['goodwe', 'good we', 'goodwee']
    when 'kstar' then array['kstar', 'k-star', 'k star']
    when 'itel' then array['itel', 'i tel']
    when 'fox' then array['fox', 'fox ess', 'foxess']
    when 'solis' then array['solis', 'ginlong solis']
    else case when cardinality(b.aliases) = 0 then array[lower(b.name)] else b.aliases end
  end,
  package_generation_enabled = coalesce(b.package_generation_enabled, true),
  priority = coalesce(b.priority, 0);

-- Keep duplicate brand rows non-destructive. Products stay linked to their current
-- rows until an admin intentionally merges them; the UI counts distinct canonical slugs.
create index if not exists idx_brands_canonical_slug on public.brands(canonical_slug);
create index if not exists idx_brands_active_canonical_slug on public.brands(canonical_slug) where is_active = true;

drop trigger if exists validate_product_brand_category_before_write on public.products;

alter table public.products
  add column if not exists capacity_kwh numeric(10, 2) check (capacity_kwh is null or capacity_kwh > 0),
  add column if not exists usable_capacity_kwh numeric(10, 2) check (usable_capacity_kwh is null or usable_capacity_kwh > 0),
  add column if not exists panel_wattage integer check (panel_wattage is null or panel_wattage > 0),
  add column if not exists phase text check (phase is null or phase in ('single', 'three')),
  add column if not exists voltage_class text check (voltage_class is null or voltage_class in ('LV', 'HV', 'NONE')),
  add column if not exists compatibility_groups text[] not null default '{}'::text[],
  add column if not exists parallel_supported boolean not null default false,
  add column if not exists max_parallel_units integer not null default 1 check (max_parallel_units >= 1),
  add column if not exists same_model_parallel_only boolean not null default true,
  add column if not exists max_parallel_modules integer check (max_parallel_modules is null or max_parallel_modules >= 1),
  add column if not exists same_brand_compatibility_enabled boolean not null default true,
  add column if not exists package_eligible boolean not null default true,
  add column if not exists priority integer not null default 0;

create table if not exists public.product_families (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  name text not null,
  slug text not null,
  category text not null check (category in ('inverter', 'battery', 'panel')),
  voltage_type text not null default 'NONE' check (voltage_type in ('LV', 'HV', 'NONE')),
  phase text check (phase is null or phase in ('single', 'three', 'both')),
  battery_required boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'ready', 'inactive', 'admin_review')),
  notes text,
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug, category)
);

alter table public.products
  add column if not exists product_family_id uuid references public.product_families(id) on delete set null;

create table if not exists public.family_compatibility (
  id uuid primary key default gen_random_uuid(),
  inverter_family_id uuid not null references public.product_families(id) on delete cascade,
  battery_family_id uuid not null references public.product_families(id) on delete cascade,
  status text not null default 'compatible' check (status in ('preferred', 'compatible', 'incompatible')),
  priority integer not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inverter_family_id, battery_family_id)
);

create table if not exists public.package_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  customer_title text,
  primary_inverter_family_id uuid not null references public.product_families(id) on delete restrict,
  battery_selection_mode text not null default 'all_compatible' check (battery_selection_mode in ('all_compatible', 'selected_families', 'none')),
  allowed_battery_family_ids uuid[] not null default '{}'::uuid[],
  preferred_battery_family_id uuid references public.product_families(id) on delete set null,
  panel_selection_mode text not null default 'all_active' check (panel_selection_mode in ('all_active', 'selected_brands', 'selected_products')),
  selected_panel_brand_ids uuid[] not null default '{}'::uuid[],
  selected_panel_product_ids uuid[] not null default '{}'::uuid[],
  preferred_panel_product_id uuid references public.products(id) on delete set null,
  package_image_url text,
  description text,
  priority integer not null default 0,
  enable_basic boolean not null default true,
  enable_recommended boolean not null default true,
  enable_better boolean not null default true,
  allow_parallel_inverters boolean not null default true,
  minimum_basic_sizing_percentage numeric(5, 2) not null default 90 check (minimum_basic_sizing_percentage > 0 and minimum_basic_sizing_percentage <= 100),
  maximum_oversizing_percentage numeric(6, 2) check (maximum_oversizing_percentage is null or maximum_oversizing_percentage >= 0),
  status text not null default 'draft' check (status in ('draft', 'live', 'inactive')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_compatibility_exceptions (
  id uuid primary key default gen_random_uuid(),
  source_product_id uuid not null references public.products(id) on delete cascade,
  target_product_id uuid not null references public.products(id) on delete cascade,
  status text not null check (status in ('preferred', 'compatible', 'incompatible')),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_product_id, target_product_id)
);

update public.products p
set
  capacity_kwh = coalesce(
    p.capacity_kwh,
    p.battery_capacity_kwh,
    case when p.category = 'battery' then p.capacity_kw else null end
  ),
  panel_wattage = coalesce(p.panel_wattage, p.capacity_watt),
  phase = coalesce(
    p.phase,
    case
      when concat_ws(' ', p.name, p.model, p.description, p.specifications::text) ~* '(3[ -]?phase|three[ -]?phase|3p)' then 'three'
      when concat_ws(' ', p.name, p.model, p.description, p.specifications::text) ~* '(1[ -]?phase|single[ -]?phase|1p)' then 'single'
      else null
    end
  ),
  voltage_class = coalesce(
    p.voltage_class,
    case
      when p.category not in ('inverter', 'battery') then 'NONE'
      when concat_ws(' ', p.name, p.model, p.description, p.specifications::text) ~* '(high[ -]?voltage|\mHV\M)' then 'HV'
      when concat_ws(' ', p.name, p.model, p.description, p.specifications::text) ~* '(low[ -]?voltage|\mLV\M)'
        or concat_ws(' ', p.name, p.model) ~* '(24\s*V|48\s*V|51\.2\s*V)' then 'LV'
      else null
    end
  ),
  package_eligible = coalesce(p.package_eligible, p.is_active),
  priority = coalesce(p.priority, 0)
where p.category in ('inverter', 'battery', 'solar_panel', 'panel');

insert into public.product_families (
  brand_id,
  name,
  slug,
  category,
  voltage_type,
  phase,
  battery_required,
  status,
  is_active,
  priority
)
select
  p.brand_id,
  b.name || ' ' || p.voltage_class,
  lower(regexp_replace(b.name || '-' || p.voltage_class || '-' || p.category, '[^a-zA-Z0-9]+', '-', 'g')),
  case when p.category = 'battery' then 'battery' else 'inverter' end,
  p.voltage_class,
  case
    when count(distinct p.phase) filter (where p.phase in ('single', 'three')) > 1 then 'both'
    else max(p.phase) filter (where p.phase in ('single', 'three'))
  end,
  p.category <> 'inverter' or p.voltage_class <> 'NONE',
  case when bool_or(p.voltage_class is null) then 'admin_review' else 'draft' end,
  true,
  max(coalesce(p.priority, 0))
from public.products p
join public.brands b on b.id = p.brand_id
where p.category in ('inverter', 'battery')
  and p.voltage_class in ('LV', 'HV', 'NONE')
group by p.brand_id, b.name, p.voltage_class, p.category
on conflict (brand_id, slug, category) do update
set
  name = excluded.name,
  voltage_type = excluded.voltage_type,
  phase = excluded.phase,
  battery_required = excluded.battery_required,
  updated_at = now();

update public.products p
set product_family_id = pf.id,
    compatibility_groups = case
      when p.category in ('inverter', 'battery') and p.voltage_class in ('LV', 'HV') and cardinality(p.compatibility_groups) = 0
        then array[upper(regexp_replace(b.name, '[^a-zA-Z0-9]+', '', 'g')) || '-' || p.voltage_class]
      else p.compatibility_groups
    end
from public.product_families pf
join public.brands b on b.id = pf.brand_id
where pf.brand_id = p.brand_id
  and pf.category = case when p.category = 'battery' then 'battery' else 'inverter' end
  and pf.voltage_type = p.voltage_class
  and p.category in ('inverter', 'battery');

insert into public.family_compatibility (
  inverter_family_id,
  battery_family_id,
  status,
  priority,
  is_active,
  notes
)
select distinct
  inv_pf.id,
  bat_pf.id,
  'compatible',
  0,
  true,
  'Backfilled from legacy brand compatibility. Admin should review before publishing templates.'
from public.product_compatibility legacy
join public.product_families inv_pf
  on inv_pf.brand_id = legacy.inverter_brand_id
  and inv_pf.category = 'inverter'
join public.product_families bat_pf
  on bat_pf.brand_id = legacy.compatible_battery_brand_id
  and bat_pf.category = 'battery'
  and bat_pf.voltage_type = inv_pf.voltage_type
where legacy.is_active = true
  and inv_pf.voltage_type in ('LV', 'HV')
on conflict (inverter_family_id, battery_family_id) do update
set
  is_active = excluded.is_active,
  updated_at = now();

insert into public.package_templates (
  name,
  slug,
  customer_title,
  primary_inverter_family_id,
  battery_selection_mode,
  panel_selection_mode,
  package_image_url,
  priority,
  status,
  is_active
)
select
  pf.name || ' Package',
  lower(regexp_replace(pf.name || '-package', '[^a-zA-Z0-9]+', '-', 'g')),
  pf.name || ' Package',
  pf.id,
  case when pf.battery_required then 'all_compatible' else 'none' end,
  'all_active',
  b.package_image_url,
  coalesce(b.priority, 0),
  'draft',
  true
from public.product_families pf
join public.brands b on b.id = pf.brand_id
where pf.category = 'inverter'
on conflict (slug) do update
set
  name = excluded.name,
  customer_title = excluded.customer_title,
  package_image_url = coalesce(public.package_templates.package_image_url, excluded.package_image_url),
  updated_at = now();

update public.brands b
set default_compatibility_group = coalesce(
  b.default_compatibility_group,
  (
    select p.compatibility_groups[1]
    from public.products p
    where p.brand_id = b.id
      and p.category in ('inverter', 'battery')
      and cardinality(p.compatibility_groups) > 0
    order by p.priority desc, p.created_at
    limit 1
  )
);

create index if not exists idx_products_package_generation
  on public.products(category, brand_id, priority desc)
  where is_active = true and package_eligible = true;
create index if not exists idx_products_product_family_id on public.products(product_family_id);
create index if not exists idx_products_compatibility_groups on public.products using gin(compatibility_groups);
create index if not exists idx_product_families_brand_category on public.product_families(brand_id, category, voltage_type) where is_active = true;
create index if not exists idx_family_compatibility_inverter on public.family_compatibility(inverter_family_id) where is_active = true;
create index if not exists idx_family_compatibility_battery on public.family_compatibility(battery_family_id) where is_active = true;
create index if not exists idx_package_templates_family on public.package_templates(primary_inverter_family_id) where is_active = true;
create index if not exists idx_package_templates_live on public.package_templates(status, priority desc) where is_active = true;
create index if not exists idx_package_brands_enabled on public.brands(priority desc) where is_active = true and package_generation_enabled = true;
create index if not exists idx_product_compatibility_exceptions_source on public.product_compatibility_exceptions(source_product_id) where is_active = true;

drop trigger if exists set_product_families_updated_at on public.product_families;
create trigger set_product_families_updated_at
before update on public.product_families
for each row execute function private.set_updated_at();

drop trigger if exists set_family_compatibility_updated_at on public.family_compatibility;
create trigger set_family_compatibility_updated_at
before update on public.family_compatibility
for each row execute function private.set_updated_at();

drop trigger if exists set_package_templates_updated_at on public.package_templates;
create trigger set_package_templates_updated_at
before update on public.package_templates
for each row execute function private.set_updated_at();

drop trigger if exists set_product_compatibility_exceptions_updated_at on public.product_compatibility_exceptions;
create trigger set_product_compatibility_exceptions_updated_at
before update on public.product_compatibility_exceptions
for each row execute function private.set_updated_at();

alter table public.product_families enable row level security;
alter table public.family_compatibility enable row level security;
alter table public.package_templates enable row level security;
alter table public.product_compatibility_exceptions enable row level security;

drop policy if exists "product_families_public_read" on public.product_families;
create policy "product_families_public_read"
on public.product_families for select
to anon, authenticated
using (is_active = true);

drop policy if exists "product_families_admin_manage" on public.product_families;
create policy "product_families_admin_manage"
on public.product_families for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "family_compatibility_public_read" on public.family_compatibility;
create policy "family_compatibility_public_read"
on public.family_compatibility for select
to anon, authenticated
using (is_active = true);

drop policy if exists "family_compatibility_admin_manage" on public.family_compatibility;
create policy "family_compatibility_admin_manage"
on public.family_compatibility for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "package_templates_public_read" on public.package_templates;
create policy "package_templates_public_read"
on public.package_templates for select
to anon, authenticated
using (is_active = true and status = 'live');

drop policy if exists "package_templates_admin_manage" on public.package_templates;
create policy "package_templates_admin_manage"
on public.package_templates for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "package_exceptions_public_read" on public.product_compatibility_exceptions;
create policy "package_exceptions_public_read"
on public.product_compatibility_exceptions for select
to anon, authenticated
using (is_active = true);

drop policy if exists "package_exceptions_admin_manage" on public.product_compatibility_exceptions;
create policy "package_exceptions_admin_manage"
on public.product_compatibility_exceptions for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

grant select on public.product_families, public.family_compatibility, public.package_templates, public.product_compatibility_exceptions to anon, authenticated;
grant insert, update, delete on public.product_families, public.family_compatibility, public.package_templates, public.product_compatibility_exceptions to authenticated;

notify pgrst, 'reload schema';

commit;
