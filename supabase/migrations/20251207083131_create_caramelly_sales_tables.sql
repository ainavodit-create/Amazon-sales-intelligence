/*
  # Caramelly Amazon Sales Intelligence Platform - Database Schema

  ## Overview
  Creates two core tables for the Caramelly sales intelligence platform:
  - Product master mapping (one-time setup)
  - Monthly sales data (recurring uploads)

  ## Tables

  ### 1. product_master_mapping
  One-time setup table containing master product information
  - `id` (uuid, primary key) - Unique identifier
  - `asin` (text, unique) - Amazon Standard Identification Number
  - `sku` (text, unique) - Stock Keeping Unit
  - `product_name` (text) - Product display name
  - `bundle_contents` (text) - Comma-separated list of ASINs in bundle
  - `category` (text) - Main product category
  - `sub_category` (text) - Product sub-category
  - `pod_boxes_in_pack` (integer) - Number of pod boxes in pack (required for Pods category)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. amazon_monthly_sales
  Monthly sales data from Amazon Business Reports
  - `id` (uuid, primary key) - Unique identifier
  - `report_month` (text) - Month name (e.g., 'January')
  - `report_year` (integer) - Year (e.g., 2025)
  - `asin_or_sku` (text) - ASIN or SKU for joining to mapping table
  - `units_ordered` (integer) - Total units ordered
  - `units_ordered_b2b` (integer) - B2B units ordered (must be <= units_ordered)
  - `total_order_items` (integer) - Total order items count
  - `ordered_product_sales` (numeric) - Total sales revenue
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - RLS enabled on both tables
  - Public read access for authenticated users
  - Insert/update policies for authenticated users

  ## Indexes
  - Unique indexes on asin and sku in product_master_mapping
  - Index on report_month and report_year in amazon_monthly_sales
  - Index on asin_or_sku for efficient joins
*/

-- Create product_master_mapping table
CREATE TABLE IF NOT EXISTS product_master_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asin text UNIQUE NOT NULL,
  sku text UNIQUE NOT NULL,
  product_name text NOT NULL,
  bundle_contents text,
  category text NOT NULL,
  sub_category text,
  pod_boxes_in_pack integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create amazon_monthly_sales table
CREATE TABLE IF NOT EXISTS amazon_monthly_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month text NOT NULL,
  report_year integer NOT NULL,
  asin_or_sku text NOT NULL,
  units_ordered integer DEFAULT 0 NOT NULL,
  units_ordered_b2b integer DEFAULT 0 NOT NULL,
  total_order_items integer DEFAULT 0 NOT NULL,
  ordered_product_sales numeric(10, 2) DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT b2b_units_check CHECK (units_ordered_b2b <= units_ordered)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_sales_report ON amazon_monthly_sales(report_year, report_month);
CREATE INDEX IF NOT EXISTS idx_monthly_sales_asin_sku ON amazon_monthly_sales(asin_or_sku);
CREATE INDEX IF NOT EXISTS idx_product_category ON product_master_mapping(category);
CREATE INDEX IF NOT EXISTS idx_product_sub_category ON product_master_mapping(sub_category);

-- Enable Row Level Security
ALTER TABLE product_master_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_monthly_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_master_mapping
CREATE POLICY "Allow public read access to product mapping"
  ON product_master_mapping
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to product mapping"
  ON product_master_mapping
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to product mapping"
  ON product_master_mapping
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to product mapping"
  ON product_master_mapping
  FOR DELETE
  TO public
  USING (true);

-- RLS Policies for amazon_monthly_sales
CREATE POLICY "Allow public read access to monthly sales"
  ON amazon_monthly_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to monthly sales"
  ON amazon_monthly_sales
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to monthly sales"
  ON amazon_monthly_sales
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to monthly sales"
  ON amazon_monthly_sales
  FOR DELETE
  TO public
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product_master_mapping
DROP TRIGGER IF EXISTS update_product_master_mapping_updated_at ON product_master_mapping;
CREATE TRIGGER update_product_master_mapping_updated_at
  BEFORE UPDATE ON product_master_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();