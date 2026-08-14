-- Adds 'ev_charger' as a new top-level marketplace product category.
--
-- IMPORTANT: this migration must be applied and committed on its own,
-- BEFORE migration 202608140002 runs. PostgreSQL does not allow a newly
-- added enum value to be referenced (in a CHECK constraint, a WHERE
-- predicate, a cast, etc.) inside the same transaction that added it —
-- doing so raises "unsafe use of new value of enum type". Since the
-- Supabase migration runner applies each file as its own transaction,
-- keeping this ALTER TYPE isolated in its own file is what makes the
-- follow-up migration (which filters/indexes on category =
-- 'ev_charger'::public.product_category) safe to run immediately after.
--
-- This migration does nothing else: no columns, no indexes, no RLS,
-- no data changes. It only extends the enum.

alter type public.product_category add value if not exists 'ev_charger';
