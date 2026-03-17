import { useState, useEffect } from 'react';
import { Package, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { MainContentContainer } from './MainContentContainer';
import { useDemoMode } from '../contexts/DemoModeContext';
import { formatProductTitle } from '../lib/demoTransform';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2025, 2026, 2027];

interface InventoryItem {
  product_name: string;
  asin: string;
  category: string;
  sub_category: string | null;
  units_sold_as_single: number;
  units_sold_in_bundles: number;
  pod_boxes_from_singles: number;
  pod_boxes_from_bundles: number;
  total_pod_boxes: number;
  bundle_breakdown: Array<{ bundle_name: string; units: number; boxes: number }>;
}

export function InventoryReport() {
  const { isDemoMode } = useDemoMode();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<Array<{ month: string; year: number }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  const fetchAvailableMonths = async () => {
    try {
      const { data, error } = await supabase
        .from('amazon_monthly_sales')
        .select('report_month, report_year')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });

      if (error) throw error;

      const unique = Array.from(
        new Set(data?.map(d => `${d.report_month}-${d.report_year}`))
      ).map(key => {
        const [month, year] = key.split('-');
        return { month, year: parseInt(year) };
      });

      setAvailableMonths(unique);

      if (unique.length > 0) {
        setSelectedMonth(unique[0].month);
        setSelectedYear(unique[0].year);
      }
    } catch (error) {
      console.error('Error fetching available months:', error);
    }
  };

  const fetchInventoryData = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Error',
        description: 'Please select both month and year',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('amazon_monthly_sales')
        .select('asin_or_sku, units_ordered')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear);

      if (salesError) throw salesError;

      if (!salesData || salesData.length === 0) {
        toast({
          title: 'No Data',
          description: `No sales data found for ${selectedMonth} ${selectedYear}`,
          variant: 'destructive',
        });
        setInventoryData([]);
        setLoading(false);
        return;
      }

      const { data: allMappingData, error: mappingError } = await supabase
        .from('product_master_mapping')
        .select('asin, sku, product_name, category, sub_category, pod_boxes_in_pack, bundle_contents');

      if (mappingError) throw mappingError;

      const mappingByAsin = new Map(allMappingData?.map(m => [m.asin, m]) || []);
      const mappingBySku = new Map(allMappingData?.map(m => [m.sku, m]) || []);

      const baseProductMap = new Map<string, InventoryItem>();

      salesData.forEach(sale => {
        const mapping = mappingByAsin.get(sale.asin_or_sku) || mappingBySku.get(sale.asin_or_sku);
        if (!mapping) return;

        const isBundle = mapping.bundle_contents && mapping.bundle_contents.trim().length > 0;

        if (isBundle) {
          const bundleAsins = mapping.bundle_contents
            .split(',')
            .map((a: string) => a.trim())
            .filter((a: string) => a.length > 0);

          const boxesPerFlavor = bundleAsins.length > 0 ? mapping.pod_boxes_in_pack / bundleAsins.length : 0;

          bundleAsins.forEach((componentAsin: string) => {
            const componentProduct = mappingByAsin.get(componentAsin);
            if (!componentProduct) return;

            if (!baseProductMap.has(componentAsin)) {
              baseProductMap.set(componentAsin, {
                product_name: componentProduct.product_name,
                asin: componentProduct.asin,
                category: componentProduct.category,
                sub_category: componentProduct.sub_category,
                units_sold_as_single: 0,
                units_sold_in_bundles: 0,
                pod_boxes_from_singles: 0,
                pod_boxes_from_bundles: 0,
                total_pod_boxes: 0,
                bundle_breakdown: [],
              });
            }

            const item = baseProductMap.get(componentAsin)!;
            item.units_sold_in_bundles += sale.units_ordered;
            const boxesFromThisBundle = sale.units_ordered * boxesPerFlavor;
            item.pod_boxes_from_bundles += boxesFromThisBundle;
            item.total_pod_boxes += boxesFromThisBundle;
            item.bundle_breakdown.push({
              bundle_name: mapping.product_name,
              units: sale.units_ordered,
              boxes: boxesFromThisBundle,
            });
          });
        } else if (mapping.pod_boxes_in_pack > 0) {
          if (!baseProductMap.has(mapping.asin)) {
            baseProductMap.set(mapping.asin, {
              product_name: mapping.product_name,
              asin: mapping.asin,
              category: mapping.category,
              sub_category: mapping.sub_category,
              units_sold_as_single: 0,
              units_sold_in_bundles: 0,
              pod_boxes_from_singles: 0,
              pod_boxes_from_bundles: 0,
              total_pod_boxes: 0,
              bundle_breakdown: [],
            });
          }

          const item = baseProductMap.get(mapping.asin)!;
          item.units_sold_as_single += sale.units_ordered;
          const boxesFromSingles = sale.units_ordered * mapping.pod_boxes_in_pack;
          item.pod_boxes_from_singles += boxesFromSingles;
          item.total_pod_boxes += boxesFromSingles;
        }
      });

      const rawInventory = Array.from(baseProductMap.values()).sort(
        (a, b) => b.total_pod_boxes - a.total_pod_boxes
      );

      const inventory = rawInventory.map(item => ({
        ...item,
        product_name: formatProductTitle(item.product_name, isDemoMode),
        units_sold_as_single: isDemoMode ? item.units_sold_as_single * 3 : item.units_sold_as_single,
        units_sold_in_bundles: isDemoMode ? item.units_sold_in_bundles * 3 : item.units_sold_in_bundles,
        pod_boxes_from_singles: isDemoMode ? item.pod_boxes_from_singles * 3 : item.pod_boxes_from_singles,
        pod_boxes_from_bundles: isDemoMode ? item.pod_boxes_from_bundles * 3 : item.pod_boxes_from_bundles,
        total_pod_boxes: isDemoMode ? item.total_pod_boxes * 3 : item.total_pod_boxes,
        bundle_breakdown: item.bundle_breakdown.map(b => ({
          ...b,
          bundle_name: formatProductTitle(b.bundle_name, isDemoMode),
          units: isDemoMode ? b.units * 3 : b.units,
          boxes: isDemoMode ? b.boxes * 3 : b.boxes,
        })),
      }));

      setInventoryData(inventory);

      if (inventory.length === 0) {
        toast({
          title: 'No Pod Products',
          description: `No coffee pod products found for ${selectedMonth} ${selectedYear}`,
        });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPodBoxes = inventoryData.reduce((sum, item) => sum + item.total_pod_boxes, 0);
  const totalUnits = inventoryData.reduce((sum, item) => sum + item.units_sold_as_single + item.units_sold_in_bundles, 0);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  return (
    <MainContentContainer>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-gray-700" />
            Coffee Pod Inventory Report
          </h2>
          <p className="text-gray-600">View total pod boxes (singles and bundles combined) sold for a specific month</p>
        </div>

        <Card className="border-0 bg-gray-50 shadow-none">
          <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Report Month
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Report Year</label>
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchInventoryData}
                disabled={loading || !selectedMonth}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          {availableMonths.length > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-800">
                Available months: {availableMonths.map(m => `${m.month} ${m.year}`).join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

        {inventoryData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Pod Boxes Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(totalPodBoxes)}
                </p>
                <p className="text-xs text-gray-500 mt-2">{selectedMonth} {selectedYear}</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Units Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(totalUnits)}
                </p>
                <p className="text-xs text-gray-500 mt-2">All pod products</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Product Varieties</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventoryData.length}
                </p>
                <p className="text-xs text-gray-500 mt-2">Different SKUs</p>
              </div>
            </div>

            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold text-gray-800">Product-Level Inventory Breakdown</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Aggregated pod boxes by base product (combines singles and all bundle packs containing this product)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 mt-6">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700 py-4">Product Name</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Category</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 py-4">Singles Units</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 py-4">Boxes from Singles</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 py-4">Boxes from Bundles</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 py-4">Total Boxes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((item, index) => (
                      <TableRow key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors py-4">
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            {item.bundle_breakdown.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">In bundles:</span>{' '}
                                {item.bundle_breakdown.map((b, i) => (
                                  <span key={i}>
                                    {b.bundle_name} ({formatNumber(Math.round(b.boxes))} boxes)
                                    {i < item.bundle_breakdown.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.units_sold_as_single > 0 ? (
                            <span className="font-medium text-blue-700">
                              {formatNumber(item.units_sold_as_single)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.pod_boxes_from_singles > 0 ? (
                            <span className="font-medium text-green-700">
                              {formatNumber(Math.round(item.pod_boxes_from_singles))}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.pod_boxes_from_bundles > 0 ? (
                            <span className="font-medium text-purple-700">
                              {formatNumber(Math.round(item.pod_boxes_from_bundles))}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right bg-amber-50">
                          <span className="text-lg font-bold text-amber-800">
                            {formatNumber(Math.round(item.total_pod_boxes))}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </MainContentContainer>
  );
}
