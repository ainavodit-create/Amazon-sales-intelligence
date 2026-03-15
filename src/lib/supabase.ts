import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProductMasterMapping {
  id: string;
  asin: string;
  sku: string;
  product_name: string;
  bundle_contents: string | null;
  category: string;
  sub_category: string | null;
  pod_boxes_in_pack: number;
  created_at: string;
  updated_at: string;
}

export interface AmazonMonthlySales {
  id: string;
  report_month: string;
  report_year: number;
  asin_or_sku: string;
  units_ordered: number;
  units_ordered_b2b: number;
  total_order_items: number;
  ordered_product_sales: number;
  created_at: string;
}

export interface DashboardRow {
  product_name: string;
  units_ordered: number;
  units_ordered_b2b: number;
  total_order_items: number;
  ordered_product_sales: number;
  pod_boxes_sold: number;
  average_cost_per_unit: number;
  category: string;
  sub_category: string | null;
}
