/*
  # Remove Insecure Anonymous RLS Policies

  ## Overview
  This migration removes RLS policies that use `USING (true)` which effectively bypass
  row-level security. This addresses security scanner findings.

  ## Changes Made
  1. Drop all anonymous user policies that allow unrestricted access
  2. Tables will now require authenticated access or service role key
  3. Application should be updated to use proper authentication or service role

  ## Security Impact
  - **Before**: Anonymous users with anon key had full CRUD access
  - **After**: Only service role or authenticated users can access data
  - This is more secure but requires application authentication

  ## Tables Updated
  - product_master_mapping (4 policies removed)
  - amazon_monthly_sales (4 policies removed)
  - amazon_monthly_returns (4 policies removed)
  - returns_data_sources (4 policies removed)

  ## Important Notes
  - The frontend application will need to be updated to either:
    1. Implement user authentication (recommended for production)
    2. Use service role key for internal tools (less secure but acceptable for internal use)
  - RLS is still enabled on all tables
  - Service role bypasses RLS and maintains full access
*/

-- ============================================================================
-- product_master_mapping: Remove insecure anon policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow anon select to product mapping" ON product_master_mapping;
DROP POLICY IF EXISTS "Allow anon insert to product mapping" ON product_master_mapping;
DROP POLICY IF EXISTS "Allow anon update to product mapping" ON product_master_mapping;
DROP POLICY IF EXISTS "Allow anon delete to product mapping" ON product_master_mapping;

-- ============================================================================
-- amazon_monthly_sales: Remove insecure anon policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow anon select to monthly sales" ON amazon_monthly_sales;
DROP POLICY IF EXISTS "Allow anon insert to monthly sales" ON amazon_monthly_sales;
DROP POLICY IF EXISTS "Allow anon update to monthly sales" ON amazon_monthly_sales;
DROP POLICY IF EXISTS "Allow anon delete to monthly sales" ON amazon_monthly_sales;

-- ============================================================================
-- amazon_monthly_returns: Remove insecure anon policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow anon select to returns" ON amazon_monthly_returns;
DROP POLICY IF EXISTS "Allow anon insert to returns" ON amazon_monthly_returns;
DROP POLICY IF EXISTS "Allow anon update to returns" ON amazon_monthly_returns;
DROP POLICY IF EXISTS "Allow anon delete to returns" ON amazon_monthly_returns;

-- ============================================================================
-- returns_data_sources: Remove insecure anon policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow anon select to returns sources" ON returns_data_sources;
DROP POLICY IF EXISTS "Allow anon insert to returns sources" ON returns_data_sources;
DROP POLICY IF EXISTS "Allow anon update to returns sources" ON returns_data_sources;
DROP POLICY IF EXISTS "Allow anon delete to returns sources" ON returns_data_sources;

-- ============================================================================
-- Create secure policies for authenticated users
-- ============================================================================
-- Note: Since this app doesn't have auth yet, these policies will effectively
-- lock down the tables. The service role key can still access everything.
-- When authentication is implemented, these policies will automatically work.

-- product_master_mapping policies for authenticated users
CREATE POLICY "Authenticated users can read product mapping"
  ON product_master_mapping
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product mapping"
  ON product_master_mapping
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product mapping"
  ON product_master_mapping
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product mapping"
  ON product_master_mapping
  FOR DELETE
  TO authenticated
  USING (true);

-- amazon_monthly_sales policies for authenticated users
CREATE POLICY "Authenticated users can read monthly sales"
  ON amazon_monthly_sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert monthly sales"
  ON amazon_monthly_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update monthly sales"
  ON amazon_monthly_sales
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete monthly sales"
  ON amazon_monthly_sales
  FOR DELETE
  TO authenticated
  USING (true);

-- amazon_monthly_returns policies for authenticated users
CREATE POLICY "Authenticated users can read returns"
  ON amazon_monthly_returns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert returns"
  ON amazon_monthly_returns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update returns"
  ON amazon_monthly_returns
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete returns"
  ON amazon_monthly_returns
  FOR DELETE
  TO authenticated
  USING (true);

-- returns_data_sources policies for authenticated users
CREATE POLICY "Authenticated users can read returns sources"
  ON returns_data_sources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert returns sources"
  ON returns_data_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update returns sources"
  ON returns_data_sources
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete returns sources"
  ON returns_data_sources
  FOR DELETE
  TO authenticated
  USING (true);
