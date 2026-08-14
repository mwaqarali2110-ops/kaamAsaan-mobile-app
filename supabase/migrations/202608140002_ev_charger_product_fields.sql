-- EV Charger product support. Requires 202608140001 (the 'ev_charger' enum
-- value) to already be committed — see that migration's header comment for
-- why the two must not be combined into a single transaction.
--
-- Architecture: EV Chargers are stored as ordinary public.products rows with
-- category = 'ev_charger'. No new table is created; the existing generic
-- product columns are reused as-is:
--   name, slug, brand_id, price, compare_at_price, currency_code, sku,
--   warranty, description, short_spec, secondary_spec, image_url,
--   gallery_images, stock_status, stock_quantity, is_active, is_featured,
--   priority, specifications (jsonb), created_at, updated_at.
--
-- The existing `phase` column (added by 202607170001, check constrained to
-- 'single' | 'three') is also reused as-is for AC chargers. DC chargers (and
-- ACs where the electrician hasn't specified it) simply leave phase NULL —
-- that is "not applicable" for this column; no constraint change needed.
--
-- Only three columns are genuinely new, because they are the fields a
-- customer actually filters/sorts by in the marketplace list (Charger Type,
-- Power, Connector). Everything else EV-specific and rarely filtered
-- (installation type, cable configuration, cable length, IP rating,
-- connectivity) belongs in the existing `specifications` jsonb column,
-- which already has a GIN index (idx_products_specifications_gin from the
-- base schema) and needs nothing new here.

alter table public.products
  add column if not exists charger_type text
    check (charger_type is null or charger_type in ('ac', 'dc')),
  add column if not exists charger_power_kw numeric(6, 2)
    check (charger_power_kw is null or charger_power_kw > 0),
  add column if not exists connector_type text
    check (connector_type is null or connector_type in ('type_1', 'type_2', 'ccs_2', 'chademo', 'gb_t', 'other'));

-- Two narrow partial indexes, both scoped to active EV charger rows only —
-- this keeps them tiny and keeps every other category's query plans
-- untouched. Enum comparison uses an explicit cast, never category::text,
-- per project convention for partial-index predicates.
create index if not exists idx_products_ev_charger_filters
  on public.products (charger_type, charger_power_kw, connector_type)
  where category = 'ev_charger'::public.product_category and is_active = true;

create index if not exists idx_products_ev_charger_sort
  on public.products (is_featured desc, priority asc, updated_at desc)
  where category = 'ev_charger'::public.product_category and is_active = true;

-- No RLS changes. public.products already has two generic, category-agnostic
-- policies (see supabase-sql-schema.sql):
--   products_public_read  — anon/authenticated may select where is_active
--   products_admin_manage — authenticated admins (private.is_admin()) may do
--                            anything
-- Both apply to ev_charger rows automatically; no new policy is created.
--
-- No changes to products_managed_category_check: no such constraint exists
-- in this project's schema (verified against supabase-sql-schema.sql,
-- migrations 001-007, and database-schema.md). Category values are governed
-- solely by the public.product_category enum extended in 202608140001.
--
-- No existing product rows are modified. No table is dropped or truncated.
