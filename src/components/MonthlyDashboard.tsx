import { useState, useEffect, useMemo } from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase, DashboardRow } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { DashboardTable } from './DashboardTable';
import { DashboardCharts } from './DashboardCharts';
import { Badge } from './ui/badge';
import { MainContentContainer } from './MainContentContainer';
import { useDemoMode } from '../contexts/DemoModeContext';
import { applyDemoTransform } from '../lib/demoTransform';
import { PeriodSelector } from './PeriodSelector';

export function MonthlyDashboard() {
  const { isDemoMode } = useDemoMode();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [monthsWithData, setMonthsWithData] = useState<Set<string>>(new Set());
  const [data, setData] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'sales' | 'units'>('sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableMonths();
  }, []);

  useEffect(() => {
    fetchMonthsWithData(selectedYear);
  }, [selectedYear]);

  const loadAvailableMonths = async () => {
    const { data: salesData } = await supabase
      .from('amazon_monthly_sales')
      .select('report_month, report_year')
      .order('report_year', { ascending: false })
      .order('report_month', { ascending: false })
      .limit(1);

    if (salesData && salesData.length > 0) {
      setSelectedYear(salesData[0].report_year);
      setSelectedMonth(salesData[0].report_month);
    }
  };

  const fetchMonthsWithData = async (year: number) => {
    const { data } = await supabase
      .from('amazon_monthly_sales')
      .select('report_month')
      .eq('report_year', year);

    const months = new Set(data?.map(r => r.report_month) ?? []);
    setMonthsWithData(months);
  };


  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadDashboardData();
    }
  }, [selectedMonth, selectedYear, isDemoMode]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('amazon_monthly_sales')
        .select('*')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear);

      if (salesError) throw salesError;

      if (!salesData || salesData.length === 0) {
        toast({
          title: 'No Data',
          description: `No sales data found for ${selectedMonth} ${selectedYear}`,
          variant: 'destructive',
        });
        setData([]);
        setLoading(false);
        return;
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

      const displayData = isDemoMode ? applyDemoTransform(joinedData) : joinedData;

      setData(displayData);

      const uniqueCategories = Array.from(new Set(displayData.map(r => r.category)));
      const uniqueSubCategories = Array.from(
        new Set(displayData.map(r => r.sub_category).filter(Boolean) as string[])
      );

      setCategories(uniqueCategories);
      setSubCategories(uniqueSubCategories);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(row => selectedCategories.includes(row.category));
    }

    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter(row =>
        row.sub_category && selectedSubCategories.includes(row.sub_category)
      );
    }

    filtered.sort((a, b) => {
      const aValue = sortBy === 'sales' ? a.ordered_product_sales : a.units_ordered;
      const bValue = sortBy === 'sales' ? b.ordered_product_sales : b.units_ordered;

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [data, selectedCategories, selectedSubCategories, sortBy, sortOrder]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubCategoryToggle = (subCategory: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCategory)
        ? prev.filter(c => c !== subCategory)
        : [...prev, subCategory]
    );
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <MainContentContainer title="Monthly Sales Dashboard">
      <div className="space-y-6">
        <Card className="border border-gray-200 bg-white shadow-none">
          <CardContent className="pt-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">Report Period</label>
              <PeriodSelector
                month={selectedMonth}
                year={selectedYear}
                dataAware
                monthsWithData={monthsWithData}
                onYearPreview={async (y) => {
                  const { data } = await supabase
                    .from('amazon_monthly_sales')
                    .select('report_month')
                    .eq('report_year', y);
                  setMonthsWithData(new Set(data?.map(r => r.report_month) ?? []));
                }}
                onSelect={(m, y) => {
                  setSelectedMonth(m);
                  setSelectedYear(y);
                  setData([]);
                }}
              />
            </div>

            <Button onClick={loadDashboardData} disabled={loading || !selectedMonth} className="w-full">
              {loading ? 'Loading...' : 'Load Dashboard'}
            </Button>
          </CardContent>
        </Card>

        {data.length > 0 && (
          <>
            <Card className="border border-gray-200 bg-white shadow-none">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5" />
                    Filters & Sort
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <Badge
                          key={category}
                          variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleCategoryToggle(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Sub-Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {subCategories.map(subCategory => (
                        <Badge
                          key={subCategory}
                          variant={selectedSubCategories.includes(subCategory) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleSubCategoryToggle(subCategory)}
                        >
                          {subCategory}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Sort By</label>
                      <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'sales' | 'units')}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales (Rs.)</SelectItem>
                          <SelectItem value="units">Units Ordered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSort}
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <DashboardCharts data={filteredAndSortedData} />
            </div>

            <div>
              <DashboardTable data={filteredAndSortedData} />
            </div>
          </>
        )}
      </div>
    </MainContentContainer>
  );
}
