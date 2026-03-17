import { DashboardRow } from './supabase';

const demoProductMapping: Record<string, string> = {
  "Super Saver Pack": "Mega Value Bundle",
  "Flavourites Pack": "Taste Explorer Bundle",
  "Barista Pack": "Cafe Master Pack",
  "Variety Pack": "Assorted Selection Pack",
  "Dark Roast Pack": "Midnight Roast Bundle",
  "Limited Edition Pack": "Exclusive Reserve Pack",
  "Chocolate Pack": "Cocoa Infusion Pack",
  "French Vanilla Pack of 3": "Parisian Vanilla Trio",
  "Rocher Hazelnut Pack of 3": "Praline Nut Trio",
  "Caramel Crumble Pack of 3": "Toffee Crunch Trio",
  "Hazelnut Praline Pack of 3": "Nutty Delight Trio",
  "Viennese Roast Pack of 3": "Austrian Dark Trio",
  "Ristretto Intenso Pack of 3": "Bold Ristretto Trio",
  "Double Chocolate Pack of 3": "Rich Cocoa Trio",
  "French Vanilla Single Pack": "Parisian Vanilla Solo",
  "Rocher Hazelnut Single Pack": "Praline Nut Solo",
  "Caramel Crumble Single Pack": "Toffee Crunch Solo",
  "Double Chocolate Single Pack": "Rich Cocoa Solo",
  "Pumpkin Spice": "Autumn Harvest Spice",
  "Hazelnut Praline Single Pack": "Nutty Delight Solo",
  "Bailey's Flavour": "Irish Cream Flavour",
  "Roasted Almond": "Toasted Almond",
  "Decaf Brunch": "Caffeine-Free Morning",
  "Raspberry Chocolate": "Berry Cocoa",
  "Espresso Dark": "Midnight Espresso",
  "Viennese Roast Single Pack": "Austrian Dark Solo",
  "Ristretto Intenso": "Bold Ristretto",
  "Iced Vanilla Latte": "Chilled Vanilla Froth",
  "Dubai Chocolate": "Desert Cocoa Blend",
  "Biscoffee": "Biscuit Brew",
  "Discovery Pack": "Beginner's Voyage Pack",
  "FoamLatte Pro": "FrothMaster Elite",
  "R51.X Conical Burr Coffee Grinder": "X90 Precision Burr Grinder",
  "Fikapresso Pro (FBM)": "BrewPro Max (Self-Ship)",
  "Fikapresso (FBM)": "BrewPro Standard (Self-Ship)",
  "Nespresso Essenza Mini ": "BrewSystem Compact",
  "Fikapresso (FBA)": "BrewPro Standard (FBA)",
  "Fikapresso (FBM 1)": "BrewPro Standard V2",
  "Breville the Barista Express": "BrewMaster Cafe Station",
  "Espresso Pop (Black)": "Shot Press (Midnight)",
  "Espresso Pop (Red)": "Shot Press (Crimson)",
  "Espresso Pop Combo (Red)": "Shot Press Bundle (Crimson)",
  "Espresso Pop Combo (Balck)": "Shot Press Bundle (Midnight)",
  "Caffenu Cleaning Capsules 5": "PuroClean Pods (5-Pack)",
  "Breville Espresso Machine Cleaning Tablets x10 (FBM)": "BrewMaster Cleaning Tabs x10",
  "Caffenu Descaler Kit 200ml": "PuroClean Descale Fluid 200ml",
  "Caramelly Water Filter for Breville (2)": "Bingo Aqua Filter for BrewMaster (2)",
  "Breville Espresso Machine Cleaning Tablets x10 (FBA)": "BrewMaster Cleaning Tabs x10 (FBA)",
  "Caffenu Descaling & Cleaning Kit (200ml Descaler Solution & 5 Pods)": "PuroClean Complete Care Kit",
  "Caramelly Replacement Charcoal Water Filters(6) ": "Bingo Charcoal Filters (6-Pack)",
  "Caffenu Descaler Kit 2x200ml": "PuroClean Descale Twin Pack",
  "Voyage Mug (Red)": "Journey Tumbler (Crimson)",
  "Caramelly Double Walled Latte Glass (2)": "Bingo Thermo Glass Set (2)",
};

export function obfuscateProductName(name: string): string {
  const exact = demoProductMapping[name.trim()];
  if (exact) return exact;
  const exactTrimmed = demoProductMapping[name];
  if (exactTrimmed) return exactTrimmed;
  return name
    .replace(/Caramelly/g, 'Bingo')
    .replace(/Nespresso/g, 'BrewSystem')
    .replace(/Breville/g, 'BrewMaster')
    .replace(/Caffenu/g, 'PuroClean')
    .replace(/Fikapresso/g, 'BrewPro');
}

export function obfuscateAsin(asin: string): string {
  if (!asin || asin.length < 4) return asin;
  return 'X9Y8' + asin.slice(4);
}

export function obfuscateSku(sku: string): string {
  return sku.replace(/cmelly/g, 'bngo');
}

export function applyDemoTransform(rows: DashboardRow[]): DashboardRow[] {
  return rows.map(row => ({
    ...row,
    product_name: obfuscateProductName(row.product_name),
    units_ordered: row.units_ordered * 3,
    units_ordered_b2b: row.units_ordered_b2b * 3,
    total_order_items: row.total_order_items * 3,
    ordered_product_sales: row.ordered_product_sales * 3,
    pod_boxes_sold: row.pod_boxes_sold * 3,
  }));
}
