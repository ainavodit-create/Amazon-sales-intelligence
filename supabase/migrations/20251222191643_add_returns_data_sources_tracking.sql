/*
  # Add Returns Data Sources Tracking

  1. New Tables
    - `returns_data_sources`
      - `id` (uuid, primary key) - Unique identifier
      - `report_month` (text) - Month of the returns report
      - `report_year` (integer) - Year of the returns report
      - `has_flex_data` (boolean) - Whether FLEX CSV data was uploaded
      - `has_fbm_data` (boolean) - Whether FBM XML data was uploaded
      - `created_at` (timestamptz) - Timestamp when record was created
      - `updated_at` (timestamptz) - Timestamp when record was last updated

  2. Constraints
    - Unique constraint on (report_month, report_year) to ensure one record per month

  3. Indexes
    - Index on (report_month, report_year) for efficient lookups

  4. Security
    - Enable RLS on `returns_data_sources` table
    - Add policies for public access (matching existing pattern)

  5. Notes
    - This table tracks which data sources have been uploaded for each month
    - Used to display dynamic disclaimers in the Returns Analysis dashboard
    - When user uploads FLEX CSV, has_flex_data is set to true
    - When user uploads FBM XML, has_fbm_data is set to true
    - Both can be true if both files are uploaded for a month
*/

CREATE TABLE IF NOT EXISTS returns_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month text NOT NULL,
  report_year integer NOT NULL,
  has_flex_data boolean DEFAULT false,
  has_fbm_data boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_returns_month_year UNIQUE (report_month, report_year)
);

CREATE INDEX IF NOT EXISTS idx_returns_sources_month_year ON returns_data_sources(report_month, report_year);

ALTER TABLE returns_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to returns sources"
  ON returns_data_sources
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to returns sources"
  ON returns_data_sources
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to returns sources"
  ON returns_data_sources
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to returns sources"
  ON returns_data_sources
  FOR DELETE
  TO public
  USING (true);

CREATE OR REPLACE FUNCTION update_returns_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_returns_data_sources_updated_at ON returns_data_sources;
CREATE TRIGGER update_returns_data_sources_updated_at
  BEFORE UPDATE ON returns_data_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_returns_sources_updated_at();
