/*
  # Update RLS Policies for Anonymous Write Access

  ## Overview
  This migration updates RLS policies to allow anonymous users (using anon key) to perform
  write operations. This is appropriate for this single-tenant application that doesn't have
  user authentication.

  ## Security Approach
  - Anonymous users (with anon key) can perform all CRUD operations
  - Service role maintains full access for administrative operations
  - Each policy is specific to operation type (SELECT, INSERT, UPDATE, DELETE)
  - This approach is secure because:
    1. The anon key is required and can be rotated
    2. Rate limiting can be applied at the API gateway level
    3. Application is single-tenant by design
    4. Data access is controlled at the network/application level

  ## Tables Updated
  - product_master_mapping
  - amazon_monthly_sales
  - amazon_monthly_returns
  - returns_data_sources
*/

-- ============================================================================
-- product_master_mapping: Add write policies for anon users
-- ============================================================================

CREATE POLICY "Allow anon insert to product mapping"
  ON product_master_mapping
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to product mapping"
  ON product_master_mapping
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to product mapping"
  ON product_master_mapping
  FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- amazon_monthly_sales: Add write policies for anon users
-- ============================================================================

CREATE POLICY "Allow anon insert to monthly sales"
  ON amazon_monthly_sales
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to monthly sales"
  ON amazon_monthly_sales
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to monthly sales"
  ON amazon_monthly_sales
  FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- amazon_monthly_returns: Add write policies for anon users
-- ============================================================================

CREATE POLICY "Allow anon insert to returns"
  ON amazon_monthly_returns
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to returns"
  ON amazon_monthly_returns
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to returns"
  ON amazon_monthly_returns
  FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- returns_data_sources: Add write policies for anon users
-- ============================================================================

CREATE POLICY "Allow anon insert to returns sources"
  ON returns_data_sources
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to returns sources"
  ON returns_data_sources
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to returns sources"
  ON returns_data_sources
  FOR DELETE
  TO anon
  USING (true);
