-- Extends products_managed_category_check to allow 'ev_charger'.
--
-- This constraint exists live in production but is NOT present in any
-- tracked schema file in this project (not in kaamAsaan-backend's
-- supabase-sql-schema.sql, its migrations/001-007, nor database-schema.md).
-- It was discovered only when an EV charger insert failed against
-- production with:
--   new row for relation "products" violates check constraint
--   "products_managed_category_check"
-- Its exact prior definition was confirmed by querying pg_constraint
-- directly against production:
--   CHECK ((category = ANY (ARRAY['solar_panel'::product_category,
--     'inverter'::product_category, 'battery'::product_category,
--     'accessory'::product_category])))
--
-- Requires 202608140001 (the 'ev_charger' enum value) to already be
-- committed, which it is — that migration was applied and verified live
-- before this one was written.

alter table public.products
  drop constraint if exists products_managed_category_check;

alter table public.products
  add constraint products_managed_category_check
  check (category = any (array[
    'solar_panel'::public.product_category,
    'inverter'::public.product_category,
    'battery'::public.product_category,
    'accessory'::public.product_category,
    'ev_charger'::public.product_category
  ]));

-- No data changes. No other constraints, indexes, or RLS policies touched.
