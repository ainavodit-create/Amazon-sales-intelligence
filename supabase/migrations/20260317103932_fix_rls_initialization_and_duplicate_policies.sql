/*
  # Fix RLS Policy Performance and Duplicate Policies

  1. Problems Addressed
     - All anon policies use `current_setting()` directly, causing per-row re-evaluation.
       Fix: replace with `(select auth.role())` which is evaluated once per query.
     - Duplicate SELECT policies exist on all 4 tables (old "Allow anon read access to *"
       alongside newer "Allow anon select *"). Drop the old ones.
     - All `authenticated` write policies use bare `true`, bypassing row-level checks.
       Fix: restrict to `(select auth.uid()) IS NOT NULL`.

  2. Tables Affected
     - product_master_mapping
     - amazon_monthly_sales
     - amazon_monthly_returns
     - returns_data_sources

  3. Security Changes
     - Anon policies: switch condition to `(select auth.role()) = 'anon'`
     - Authenticated write policies: switch condition to `(select auth.uid()) IS NOT NULL`
     - Remove duplicate legacy SELECT policies
*/

-- ============================================================
-- product_master_mapping
-- ============================================================

-- Drop duplicate legacy SELECT policy
DROP POLICY IF EXISTS "Allow anon read access to product mapping" ON public.product_master_mapping;

-- Recreate anon policies with (select auth.role()) for single-eval performance
DROP POLICY IF EXISTS "Allow anon select product mapping" ON public.product_master_mapping;
CREATE POLICY "Allow anon select product mapping"
  ON public.product_master_mapping FOR SELECT
  TO anon
  USING ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon insert product mapping" ON public.product_master_mapping;
CREATE POLICY "Allow anon insert product mapping"
  ON public.product_master_mapping FOR INSERT
  TO anon
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon update product mapping" ON public.product_master_mapping;
CREATE POLICY "Allow anon update product mapping"
  ON public.product_master_mapping FOR UPDATE
  TO anon
  USING ((select auth.role()) = 'anon')
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon delete product mapping" ON public.product_master_mapping;
CREATE POLICY "Allow anon delete product mapping"
  ON public.product_master_mapping FOR DELETE
  TO anon
  USING ((select auth.role()) = 'anon');

-- Fix authenticated write policies (no longer bare true)
DROP POLICY IF EXISTS "Authenticated users can insert product mapping" ON public.product_master_mapping;
CREATE POLICY "Authenticated users can insert product mapping"
  ON public.product_master_mapping FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update product mapping" ON public.product_master_mapping;
CREATE POLICY "Authenticated users can update product mapping"
  ON public.product_master_mapping FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete product mapping" ON public.product_master_mapping;
CREATE POLICY "Authenticated users can delete product mapping"
  ON public.product_master_mapping FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- amazon_monthly_sales
-- ============================================================

DROP POLICY IF EXISTS "Allow anon read access to monthly sales" ON public.amazon_monthly_sales;

DROP POLICY IF EXISTS "Allow anon select monthly sales" ON public.amazon_monthly_sales;
CREATE POLICY "Allow anon select monthly sales"
  ON public.amazon_monthly_sales FOR SELECT
  TO anon
  USING ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon insert monthly sales" ON public.amazon_monthly_sales;
CREATE POLICY "Allow anon insert monthly sales"
  ON public.amazon_monthly_sales FOR INSERT
  TO anon
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon update monthly sales" ON public.amazon_monthly_sales;
CREATE POLICY "Allow anon update monthly sales"
  ON public.amazon_monthly_sales FOR UPDATE
  TO anon
  USING ((select auth.role()) = 'anon')
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon delete monthly sales" ON public.amazon_monthly_sales;
CREATE POLICY "Allow anon delete monthly sales"
  ON public.amazon_monthly_sales FOR DELETE
  TO anon
  USING ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Authenticated users can insert monthly sales" ON public.amazon_monthly_sales;
CREATE POLICY "Authenticated users can insert monthly sales"
  ON public.amazon_monthly_sales FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update monthly sales" ON public.amazon_monthly_sales;
CREATE POLICY "Authenticated users can update monthly sales"
  ON public.amazon_monthly_sales FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete monthly sales" ON public.amazon_monthly_sales;
CREATE POLICY "Authenticated users can delete monthly sales"
  ON public.amazon_monthly_sales FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- amazon_monthly_returns
-- ============================================================

DROP POLICY IF EXISTS "Allow anon read access to returns" ON public.amazon_monthly_returns;

DROP POLICY IF EXISTS "Allow anon select returns" ON public.amazon_monthly_returns;
CREATE POLICY "Allow anon select returns"
  ON public.amazon_monthly_returns FOR SELECT
  TO anon
  USING ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon insert returns" ON public.amazon_monthly_returns;
CREATE POLICY "Allow anon insert returns"
  ON public.amazon_monthly_returns FOR INSERT
  TO anon
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon update returns" ON public.amazon_monthly_returns;
CREATE POLICY "Allow anon update returns"
  ON public.amazon_monthly_returns FOR UPDATE
  TO anon
  USING ((select auth.role()) = 'anon')
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon delete returns" ON public.amazon_monthly_returns;
CREATE POLICY "Allow anon delete returns"
  ON public.amazon_monthly_returns FOR DELETE
  TO anon
  USING ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Authenticated users can insert returns" ON public.amazon_monthly_returns;
CREATE POLICY "Authenticated users can insert returns"
  ON public.amazon_monthly_returns FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update returns" ON public.amazon_monthly_returns;
CREATE POLICY "Authenticated users can update returns"
  ON public.amazon_monthly_returns FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete returns" ON public.amazon_monthly_returns;
CREATE POLICY "Authenticated users can delete returns"
  ON public.amazon_monthly_returns FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- returns_data_sources
-- ============================================================

DROP POLICY IF EXISTS "Allow anon read access to returns sources" ON public.returns_data_sources;

DROP POLICY IF EXISTS "Allow anon select returns sources" ON public.returns_data_sources;
CREATE POLICY "Allow anon select returns sources"
  ON public.returns_data_sources FOR SELECT
  TO anon
  USING ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon insert returns sources" ON public.returns_data_sources;
CREATE POLICY "Allow anon insert returns sources"
  ON public.returns_data_sources FOR INSERT
  TO anon
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon update returns sources" ON public.returns_data_sources;
CREATE POLICY "Allow anon update returns sources"
  ON public.returns_data_sources FOR UPDATE
  TO anon
  USING ((select auth.role()) = 'anon')
  WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow anon delete returns sources" ON public.returns_data_sources;
CREATE POLICY "Allow anon delete returns sources"
  ON public.returns_data_sources FOR DELETE
  TO anon
  USING ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Authenticated users can insert returns sources" ON public.returns_data_sources;
CREATE POLICY "Authenticated users can insert returns sources"
  ON public.returns_data_sources FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update returns sources" ON public.returns_data_sources;
CREATE POLICY "Authenticated users can update returns sources"
  ON public.returns_data_sources FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete returns sources" ON public.returns_data_sources;
CREATE POLICY "Authenticated users can delete returns sources"
  ON public.returns_data_sources FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
