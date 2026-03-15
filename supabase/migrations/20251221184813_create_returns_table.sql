/*
  # Create Returns Analytics Table

  1. New Tables
    - `amazon_monthly_returns`
      - `id` (uuid, primary key) - Unique identifier for each returns record
      - `report_month` (text) - Month of the returns report (e.g., 'January', 'February')
      - `report_year` (integer) - Year of the returns report
      - `asin` (text) - Amazon Standard Identification Number for product mapping
      - `quantity_returned` (integer) - Total quantity of items returned for this ASIN
      - `created_at` (timestamptz) - Timestamp when record was created
      - `updated_at` (timestamptz) - Timestamp when record was last updated

  2. Indexes
    - Index on (report_month, report_year) for efficient querying by time period
    - Index on asin for efficient product lookups

  3. Security
    - Enable RLS on `amazon_monthly_returns` table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert data
    - Add policy for authenticated users to update data
    - Add policy for authenticated users to delete data

  4. Notes
    - The quantity_returned field is pre-aggregated (summed by ASIN) before insertion
    - ASINs should be validated against product_master_mapping table
    - Combination of (report_month, report_year, asin) should be unique
*/

CREATE TABLE IF NOT EXISTS amazon_monthly_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month text NOT NULL,
  report_year integer NOT NULL,
  asin text NOT NULL,
  quantity_returned integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_month_year_asin UNIQUE (report_month, report_year, asin)
);

CREATE INDEX IF NOT EXISTS idx_returns_month_year ON amazon_monthly_returns(report_month, report_year);
CREATE INDEX IF NOT EXISTS idx_returns_asin ON amazon_monthly_returns(asin);

ALTER TABLE amazon_monthly_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read returns data"
  ON amazon_monthly_returns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert returns data"
  ON amazon_monthly_returns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update returns data"
  ON amazon_monthly_returns
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete returns data"
  ON amazon_monthly_returns
  FOR DELETE
  TO authenticated
  USING (true);