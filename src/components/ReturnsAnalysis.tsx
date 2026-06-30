import { useState, useEffect } from 'react';
import { TrendingDown, PackageX, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { MainContentContainer } from './MainContentContainer';
import { useDemoMode } from '../contexts/DemoModeContext';
import { formatProductTitle } from '../lib/demoTransform';
import { PeriodSelector } from './PeriodSelector';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

interface ReturnsAnalysisData {
  product_name: string;
  asin: string;
  category: string;
  sub_category: string | null;
  units_sold: number;
  units_returned: number;
  return_rate: number;
}

interface DataSourceInfo {
  hasFlexData: boolean;
  hasFbmData: boolean;
}

export function ReturnsAnalysis() {
  const { isDemoMode } = useDemoMode();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<ReturnsAnalysisData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availableMonths, setAvailableMonths] = useState<Array<{ month: string; year: number }>>([]);
  const [dataSourceInfo, setDataSourceInfo] = useState<DataSourceInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchReturnsData();
    }
  }, [selectedMonth, selectedYear]);

  const fetchAvailableMonths = async () => {
    try {
      const { data: salesMonths } = await supabase
        .from('amazon_monthly_sales')
        .select('report_month, report_year')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });

      const { data: returnsMonths } = await supabase
        .from('amazon_monthly_returns')
        .select('report_month, report_year')
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false });

      const salesSet = new Set(
        salesMonths?.map(m => `${m.report_month}-${m.report_year}`) || []
      );
      const returnsSet = new Set(
        returnsMonths?.map(m => `${m.report_month}-${m.report_year}`) || []
      );

      const commonMonths = Array.from(salesSet)
        .filter(key => returnsSet.has(key))
        .map(key => {
          const [month, year] = key.split('-');
          return { month, year: parseInt(year) };
        });

      setAvailableMonths(commonMonths);

      if (commonMonths.length > 0 && !selectedMonth) {
        setSelectedMonth(commonMonths[0].month);
        setSelectedYear(commonMonths[0].year);
      }
    } catch (error) {
      console.error('Error fetching available months:', error);
    }
  };

  const fetchReturnsData = async () => {
    if (!selectedMonth || !selectedYear) return;

    setLoading(true);
    try {
      const { data: sourceData } = await supabase
        .from('returns_data_sources')
        .select('has_flex_data, has_fbm_data')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear)
        .maybeSingle();

      setDataSourceInfo(sourceData ? {
        hasFlexData: sourceData.has_flex_data,
        hasFbmData: sourceData.has_fbm_data,
      } : null);
      const { data: salesData, error: salesError } = await supabase
        .from('amazon_monthly_sales')
        .select('asin_or_sku, units_ordered')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear);

      if (salesError) throw salesError;

      const { data: returnsData, error: returnsError } = await supabase
        .from('amazon_monthly_returns')
        .select('asin, quantity_returned')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear);

      if (returnsError) throw returnsError;

      if (!salesData || salesData.length === 0) {
        toast({
          title: 'No Data',
          description: `No sales data found for ${selectedMonth} ${selectedYear}`,
          variant: 'destructive',
        });
        setAnalysisData([]);
        setLoading(false);
        return;
      }

      const { data: allMappingData, error: mappingError } = await supabase
        .from('product_master_mapping')
        .select('asin, sku, product_name, category, sub_category');

      if (mappingError) throw mappingError;

      const mappingByAsin = new Map(allMappingData?.map(m => [m.asin, m]) || []);
      const mappingBySku = new Map(allMappingData?.map(m => [m.sku, m]) || []);

      const salesByAsin = new Map<string, number>();
      salesData.forEach(sale => {
        const mapping = mappingByAsin.get(sale.asin_or_sku) || mappingBySku.get(sale.asin_or_sku);
        if (mapping) {
          const asin = mapping.asin;
          const currentSales = salesByAsin.get(asin) || 0;
          salesByAsin.set(asin, currentSales + sale.units_ordered);
        }
      });

      const returnsByAsin = new Map<string, number>();
      returnsData?.forEach(returnItem => {
        const current = returnsByAsin.get(returnItem.asin) || 0;
        returnsByAsin.set(returnItem.asin, current + returnItem.quantity_returned);
      });

      const allAsins = new Set([...salesByAsin.keys(), ...returnsByAsin.keys()]);

      const analysis: ReturnsAnalysisData[] = [];

      allAsins.forEach(asin => {
        const mapping = mappingByAsin.get(asin);
        if (!mapping) return;

        const unitsSold = salesByAsin.get(asin) || 0;
        const unitsReturned = returnsByAsin.get(asin) || 0;
        const returnRate = unitsSold > 0 ? (unitsReturned / unitsSold) * 100 : 0;

        analysis.push({
          product_name: mapping.product_name,
          asin: mapping.asin,
          category: mapping.category,
          sub_category: mapping.sub_category,
          units_sold: unitsSold,
          units_returned: unitsReturned,
          return_rate: returnRate,
        });
      });

      analysis.sort((a, b) => b.return_rate - a.return_rate);

      const maskedAnalysis = analysis.map(item => {
        const unitsSold = isDemoMode ? item.units_sold * 3 : item.units_sold;
        const unitsReturned = isDemoMode ? item.units_returned * 3 : item.units_returned;
        return {
          ...item,
          product_name: formatProductTitle(item.product_name, isDemoMode),
          units_sold: unitsSold,
          units_returned: unitsReturned,
          return_rate: unitsSold > 0 ? (unitsReturned / unitsSold) * 100 : 0,
        };
      });

      setAnalysisData(maskedAnalysis);

      if (analysis.length === 0) {
        toast({
          title: 'No Data',
          description: `No returns analysis data available for ${selectedMonth} ${selectedYear}`,
        });
      }
    } catch (error) {
      console.error('Error fetching returns data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load returns analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const filteredData = selectedCategory === 'All'
    ? analysisData
    : analysisData.filter(item => item.category === selectedCategory);

  const totalReturns = analysisData.reduce((sum, item) => sum + item.units_returned, 0);
  const totalSales = analysisData.reduce((sum, item) => sum + item.units_sold, 0);
  const overallReturnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;

  const categoryReturns = new Map<string, { returned: number; sold: number }>();
  analysisData.forEach(item => {
    const current = categoryReturns.get(item.category) || { returned: 0, sold: 0 };
    categoryReturns.set(item.category, {
      returned: current.returned + item.units_returned,
      sold: current.sold + item.units_sold,
    });
  });

  const categoryTotals = Array.from(categoryReturns.entries()).map(([category, data]) => ({
    category,
    returned: data.returned,
  }));

  categoryTotals.sort((a, b) => b.returned - a.returned);
  const mostReturnedCategory = categoryTotals[0];

  const categories = ['All', ...Array.from(new Set(analysisData.map(item => item.category)))];

  const chartData = filteredData.slice(0, 10).map(item => ({
    name: item.product_name.length > 20
      ? item.product_name.substring(0, 20) + '...'
      : item.product_name,
    'Units Sold': item.units_sold,
    'Units Returned': item.units_returned,
    'Return Rate %': parseFloat(item.return_rate.toFixed(2)),
  }));

  return (
    <MainContentContainer>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <PackageX className="w-6 h-6 text-gray-700" />
            Returns Analysis
          </h2>
          <p className="text-gray-600">Analyze return rates and identify problematic products</p>
        </div>

      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Period</label>
          <PeriodSelector
            month={selectedMonth}
            year={selectedYear}
            onSelect={(m, y) => {
              setSelectedMonth(m);
              setSelectedYear(y);
            }}
          />
        </div>

        {availableMonths.length > 0 && (
          <p className="text-xs text-gray-500">
            {availableMonths.length} month(s) with both sales and returns data available
          </p>
        )}
      </div>

      {dataSourceInfo && (
        <Alert className={
          dataSourceInfo.hasFlexData && dataSourceInfo.hasFbmData
            ? "border-green-500 bg-green-50"
            : "border-amber-500 bg-amber-50"
        }>
          {dataSourceInfo.hasFlexData && dataSourceInfo.hasFbmData ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Comprehensive Report:</strong> Includes both Flex and FBM return data.
              </AlertDescription>
            </>
          ) : dataSourceInfo.hasFlexData ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Note:</strong> This report contains data from FLEX Returns only. FBM Return data has not been uploaded for this month.
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Note:</strong> This report contains data from FBM Returns only. Flex Return data has not been uploaded for this month.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading returns analysis...</p>
        </div>
      ) : analysisData.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                <PackageX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatNumber(totalReturns)}</div>
                <p className="text-xs text-gray-600 mt-1">
                  units returned in {selectedMonth} {selectedYear}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Return Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {overallReturnRate.toFixed(2)}%
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {formatNumber(totalReturns)} / {formatNumber(totalSales)} units sold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Returned Category</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-600">
                  {mostReturnedCategory?.category || 'N/A'}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {mostReturnedCategory ? formatNumber(mostReturnedCategory.returned) : '0'} units returned
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales vs Returns Comparison</CardTitle>
              <CardDescription>Top 10 products by return rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                  <YAxis yAxisId="left" label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Return Rate %', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Units Sold" fill="#3b82f6" />
                  <Bar yAxisId="left" dataKey="Units Returned" fill="#ef4444" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Return Rate %"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Detailed Returns Analysis</CardTitle>
                <CardDescription>
                  Product-level breakdown sorted by return rate
                </CardDescription>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Product Name</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="text-right font-bold">Units Sold</TableHead>
                      <TableHead className="text-right font-bold">Units Returned</TableHead>
                      <TableHead className="text-right font-bold bg-red-50">Return Rate %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-blue-700">
                            {formatNumber(item.units_sold)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-red-700">
                            {formatNumber(item.units_returned)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right bg-red-50">
                          <div className="flex items-center justify-end gap-2">
                            {item.units_sold === 0 ? (
                              <span className="text-lg font-bold text-gray-500">N/A</span>
                            ) : (
                              <>
                                <span
                                  className={`text-lg font-bold ${
                                    item.return_rate > 10
                                      ? 'text-red-700'
                                      : item.return_rate > 5
                                      ? 'text-amber-700'
                                      : 'text-green-700'
                                  }`}
                                >
                                  {item.return_rate.toFixed(2)}%
                                </span>
                                {item.return_rate > 10 && (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <PackageX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No returns data available for the selected period.
              <br />
              Please upload both sales and returns data first.
            </p>
          </CardContent>
          </Card>
        )}
      </div>
    </MainContentContainer>
  );
}
