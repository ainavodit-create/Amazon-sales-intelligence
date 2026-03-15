import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase, DashboardRow } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from './ui/alert';
import { TrendHighlightCards } from './TrendHighlightCards';
import { ProductComparisonTable } from './ProductComparisonTable';
import { MainContentContainer } from './MainContentContainer';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2025, 2026, 2027];

interface MonthData {
  totalSales: number;
  totalUnits: number;
  totalOrders: number;
  rows: DashboardRow[];
}

export function ComparativeDashboard() {
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [benchmarkMonth, setBenchmarkMonth] = useState<string>('');
  const [benchmarkYear, setBenchmarkYear] = useState<number>(2025);
  const [currentData, setCurrentData] = useState<MonthData | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableMonths();
  }, []);

  const loadAvailableMonths = async () => {
    const { data: salesData } = await supabase
      .from('amazon_monthly_sales')
      .select('report_month, report_year')
      .order('report_year', { ascending: false })
      .order('report_month', { ascending: false })
      .limit(2);

    if (salesData && salesData.length >= 2) {
      setCurrentMonth(salesData[0].report_month);
      setCurrentYear(salesData[0].report_year);
      setBenchmarkMonth(salesData[1].report_month);
      setBenchmarkYear(salesData[1].report_year);
    } else if (salesData && salesData.length === 1) {
      setCurrentMonth(salesData[0].report_month);
      setCurrentYear(salesData[0].report_year);
    }
  };

  const loadMonthData = async (month: string, year: number): Promise<MonthData | null> => {
    const { data: salesData, error: salesError } = await supabase
      .from('amazon_monthly_sales')
      .select('*')
      .eq('report_month', month)
      .eq('report_year', year);

    if (salesError) throw salesError;

    if (!salesData || salesData.length === 0) {
      return null;
    }

    const { data: mappingData, error: mappingError } = await supabase
      .from('product_master_mapping')
      .select('*');

    if (mappingError) throw mappingError;

    const mappingMap = new Map(
      mappingData?.map(m => [m.asin, m]) || []
    );
    const mappingMapBySku = new Map(
      mappingData?.map(m => [m.sku, m]) || []
    );

    const joinedData: DashboardRow[] = salesData
      .map(sale => {
        const mapping = mappingMap.get(sale.asin_or_sku) || mappingMapBySku.get(sale.asin_or_sku);

        if (!mapping) return null;

        const podBoxesSold = mapping.category.toLowerCase() === 'coffee pods'
          ? sale.units_ordered * mapping.pod_boxes_in_pack
          : 0;

        const averageCostPerUnit = sale.units_ordered > 0
          ? sale.ordered_product_sales / sale.units_ordered
          : 0;

        return {
          product_name: mapping.product_name,
          units_ordered: sale.units_ordered,
          units_ordered_b2b: sale.units_ordered_b2b,
          total_order_items: sale.total_order_items,
          ordered_product_sales: sale.ordered_product_sales,
          pod_boxes_sold: podBoxesSold,
          average_cost_per_unit: averageCostPerUnit,
          category: mapping.category,
          sub_category: mapping.sub_category,
        };
      })
      .filter((row): row is DashboardRow => row !== null);

    const totalSales = joinedData.reduce((sum, row) => sum + row.ordered_product_sales, 0);
    const totalUnits = joinedData.reduce((sum, row) => sum + row.units_ordered, 0);
    const totalOrders = joinedData.reduce((sum, row) => sum + row.total_order_items, 0);

    return { totalSales, totalUnits, totalOrders, rows: joinedData };
  };

  const handleCompare = async () => {
    if (!currentMonth || !benchmarkMonth) {
      toast({
        title: 'Error',
        description: 'Please select both current month and benchmark month',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const current = await loadMonthData(currentMonth, currentYear);
      const benchmark = await loadMonthData(benchmarkMonth, benchmarkYear);

      if (!current || !benchmark) {
        toast({
          title: 'Error',
          description: 'Data not available for one or both selected months',
          variant: 'destructive',
        });
        setCurrentData(null);
        setBenchmarkData(null);
        return;
      }

      setCurrentData(current);
      setBenchmarkData(benchmark);
    } catch (error) {
      console.error('Error loading comparison data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comparison data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const calculateChange = (current: number, benchmark: number) => {
    const absolute = current - benchmark;
    const percentage = benchmark !== 0 ? ((absolute / benchmark) * 100) : 0;
    return { absolute, percentage };
  };

  const renderMetricCard = (
    title: string,
    currentValue: number,
    benchmarkValue: number,
    isCurrency: boolean = false,
    icon: React.ReactNode
  ) => {
    const { absolute, percentage } = calculateChange(currentValue, benchmarkValue);
    const isIncrease = absolute >= 0;
    const formatter = isCurrency ? formatCurrency : formatNumber;

    return (
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Current Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatter(currentValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Benchmark</p>
              <p className="text-lg font-semibold text-gray-700">{formatter(benchmarkValue)}</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl ${
            isIncrease ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
          }`}>
            {isIncrease ? (
              <TrendingUp className={`w-5 h-5 text-green-600 flex-shrink-0`} />
            ) : (
              <TrendingDown className={`w-5 h-5 text-red-600 flex-shrink-0`} />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${
                isIncrease ? 'text-green-700' : 'text-red-700'
              }`}>
                {isIncrease ? 'Increased' : 'Decreased'} by {formatter(Math.abs(absolute))}
              </p>
              <p className={`text-xs ${
                isIncrease ? 'text-green-600' : 'text-red-600'
              }`}>
                {isIncrease ? '+' : ''}{percentage.toFixed(2)}% vs benchmark
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainContentContainer>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-gray-700" />
            Comparative Analysis
          </h2>
          <p className="text-gray-600">Compare performance metrics between two different months</p>
        </div>

        <Card className="border-0 bg-gray-50 shadow-none">
          <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Current Month</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Month</label>
                  <Select value={currentMonth} onValueChange={setCurrentMonth}>
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
                  <label className="text-xs font-medium text-gray-600">Year</label>
                  <Select value={String(currentYear)} onValueChange={(val) => setCurrentYear(parseInt(val))}>
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
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Benchmark Month</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Month</label>
                  <Select value={benchmarkMonth} onValueChange={setBenchmarkMonth}>
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
                  <label className="text-xs font-medium text-gray-600">Year</label>
                  <Select value={String(benchmarkYear)} onValueChange={(val) => setBenchmarkYear(parseInt(val))}>
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
              </div>
            </div>
          </div>

          <Button
            onClick={handleCompare}
            disabled={loading || !currentMonth || !benchmarkMonth}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Compare Months'}
          </Button>
        </CardContent>
      </Card>

        {currentData && benchmarkData && (
          <>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                Comparing <strong>{currentMonth} {currentYear}</strong> (Current) vs{' '}
                <strong>{benchmarkMonth} {benchmarkYear}</strong> (Benchmark)
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderMetricCard(
                'Total Sales',
                currentData.totalSales,
                benchmarkData.totalSales,
                true,
                <span className="text-blue-600">₹</span>
              )}
              {renderMetricCard(
                'Total Units Ordered',
                currentData.totalUnits,
                benchmarkData.totalUnits,
                false,
                <span className="text-green-600">📦</span>
              )}
              {renderMetricCard(
                'Total Order Items',
                currentData.totalOrders,
                benchmarkData.totalOrders,
                false,
                <span className="text-orange-600">📋</span>
              )}
            </div>

            <TrendHighlightCards
              currentData={currentData.rows}
              benchmarkData={benchmarkData.rows}
            />

            <ProductComparisonTable
              currentData={currentData.rows}
              benchmarkData={benchmarkData.rows}
              currentMonth={currentMonth}
              benchmarkMonth={benchmarkMonth}
            />
          </>
        )}
      </div>
    </MainContentContainer>
  );
}
