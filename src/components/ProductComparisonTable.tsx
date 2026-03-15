import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProductData {
  product_name: string;
  category: string;
  sub_category: string | null;
  units_ordered: number;
  ordered_product_sales: number;
  pod_boxes_sold: number;
}

interface ProductComparisonRow {
  product_name: string;
  category: string;
  sub_category: string | null;
  benchmark_units: number;
  current_units: number;
  variance_absolute: number;
  variance_percent: number;
  benchmark_sales: number;
  current_sales: number;
  sales_variance_absolute: number;
  sales_variance_percent: number;
  is_new: boolean;
  pod_boxes_benchmark: number;
  pod_boxes_current: number;
}

interface ProductComparisonTableProps {
  currentData: ProductData[];
  benchmarkData: ProductData[];
  currentMonth: string;
  benchmarkMonth: string;
}

export function ProductComparisonTable({
  currentData,
  benchmarkData,
  currentMonth,
  benchmarkMonth,
}: ProductComparisonTableProps) {
  const comparisonData = useMemo(() => {
    const benchmarkMap = new Map(
      benchmarkData.map(p => [p.product_name, p])
    );

    const currentMap = new Map(
      currentData.map(p => [p.product_name, p])
    );

    const allProducts = new Set([
      ...currentData.map(p => p.product_name),
      ...benchmarkData.map(p => p.product_name),
    ]);

    const rows: ProductComparisonRow[] = [];

    allProducts.forEach(productName => {
      const current = currentMap.get(productName);
      const benchmark = benchmarkMap.get(productName);

      if (!current) return;

      const isNew = !benchmark || benchmark.units_ordered === 0;

      const benchmarkUnits = benchmark?.units_ordered || 0;
      const currentUnits = current.units_ordered;
      const varianceAbsolute = currentUnits - benchmarkUnits;
      const variancePercent = benchmarkUnits > 0 ? (varianceAbsolute / benchmarkUnits) * 100 : 0;

      const benchmarkSales = benchmark?.ordered_product_sales || 0;
      const currentSales = current.ordered_product_sales;
      const salesVarianceAbsolute = currentSales - benchmarkSales;
      const salesVariancePercent = benchmarkSales > 0 ? (salesVarianceAbsolute / benchmarkSales) * 100 : 0;

      rows.push({
        product_name: productName,
        category: current.category,
        sub_category: current.sub_category,
        benchmark_units: benchmarkUnits,
        current_units: currentUnits,
        variance_absolute: varianceAbsolute,
        variance_percent: variancePercent,
        benchmark_sales: benchmarkSales,
        current_sales: currentSales,
        sales_variance_absolute: salesVarianceAbsolute,
        sales_variance_percent: salesVariancePercent,
        is_new: isNew,
        pod_boxes_benchmark: benchmark?.pod_boxes_sold || 0,
        pod_boxes_current: current.pod_boxes_sold,
      });
    });

    return rows.sort((a, b) => b.current_units - a.current_units);
  }, [currentData, benchmarkData]);

  const coffeePods = useMemo(() =>
    comparisonData.filter(r => r.category.toLowerCase() === 'coffee pods'),
    [comparisonData]
  );

  const coffeeMachines = useMemo(() =>
    comparisonData.filter(r => {
      const category = r.category.toLowerCase();
      return category === 'coffee machines' || category === 'coffee machines & equipments' || category === 'equipments';
    }),
    [comparisonData]
  );

  const formatCurrency = (value: number) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const renderVarianceCell = (variance: number, percent: number, isNew: boolean) => {
    if (isNew) {
      return (
        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
          <Sparkles className="w-4 h-4" />
          NEW
        </span>
      );
    }

    const isPositive = variance >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded ${bgColor}`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <div>
          <p className={`text-sm font-semibold ${color}`}>
            {isPositive ? '+' : ''}{formatNumber(Math.abs(variance))}
          </p>
          <p className={`text-xs ${color}`}>
            {isPositive ? '+' : ''}{percent.toFixed(1)}%
          </p>
        </div>
      </div>
    );
  };

  const renderTable = (data: ProductComparisonRow[], showPodBoxes: boolean = false) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Product Name</TableHead>
            <TableHead className="font-bold">Category</TableHead>
            <TableHead className="text-right font-bold">{benchmarkMonth} Units</TableHead>
            <TableHead className="text-right font-bold">{currentMonth} Units</TableHead>
            <TableHead className="font-bold">Units Variance</TableHead>
            {showPodBoxes && (
              <>
                <TableHead className="text-right font-bold">{benchmarkMonth} Pod Boxes</TableHead>
                <TableHead className="text-right font-bold">{currentMonth} Pod Boxes</TableHead>
              </>
            )}
            <TableHead className="text-right font-bold">{benchmarkMonth} Sales</TableHead>
            <TableHead className="text-right font-bold">{currentMonth} Sales</TableHead>
            <TableHead className="font-bold">Sales Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {row.product_name}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{row.category}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatNumber(row.benchmark_units)}</TableCell>
              <TableCell className="text-right font-semibold">{formatNumber(row.current_units)}</TableCell>
              <TableCell>
                {renderVarianceCell(row.variance_absolute, row.variance_percent, row.is_new)}
              </TableCell>
              {showPodBoxes && (
                <>
                  <TableCell className="text-right">{formatNumber(row.pod_boxes_benchmark)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatNumber(row.pod_boxes_current)}</TableCell>
                </>
              )}
              <TableCell className="text-right">{formatCurrency(row.benchmark_sales)}</TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(row.current_sales)}</TableCell>
              <TableCell>
                {renderVarianceCell(row.sales_variance_absolute, row.sales_variance_percent, row.is_new)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All Products ({comparisonData.length})</TabsTrigger>
            <TabsTrigger value="pods">Coffee Pods ({coffeePods.length})</TabsTrigger>
            <TabsTrigger value="machines">Coffee Machines ({coffeeMachines.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderTable(comparisonData)}
          </TabsContent>

          <TabsContent value="pods">
            {renderTable(coffeePods, true)}
          </TabsContent>

          <TabsContent value="machines">
            {renderTable(coffeeMachines)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
