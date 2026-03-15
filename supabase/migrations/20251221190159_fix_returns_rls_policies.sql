/*
  # Fix Returns Table RLS Policies

  1. Changes
    - Drop existing policies that require authentication
    - Create new policies allowing public access (matching other tables)
    
  2. Security
    - Changes RLS from "authenticated" to "public" to match app pattern
    - Allows anonymous users with anon key to perform CRUD operations
*/

DROP POLICY IF EXISTS "Authenticated users can read returns data" ON amazon_monthly_returns;
DROP POLICY IF EXISTS "Authenticated users can insert returns data" ON amazon_monthly_returns;
DROP POLICY IF EXISTS "Authenticated users can update returns data" ON amazon_monthly_returns;
DROP POLICY IF EXISTS "Authenticated users can delete returns data" ON amazon_monthly_returns;

CREATE POLICY "Allow public read access to returns"
  ON amazon_monthly_returns
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to returns"
  ON amazon_monthly_returns
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to returns"
  ON amazon_monthly_returns
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to returns"
  ON amazon_monthly_returns
  FOR DELETE
  TO public
  USING (true);
