import { DashboardRow } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface DashboardTableProps {
  data: DashboardRow[];
}

export function DashboardTable({ data }: DashboardTableProps) {
  const formatCurrency = (value: number) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyWithDecimals = (value: number) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const totalSales = data.reduce((sum, row) => sum + row.ordered_product_sales, 0);
  const totalUnits = data.reduce((sum, row) => sum + row.units_ordered, 0);
  const totalB2BUnits = data.reduce((sum, row) => sum + row.units_ordered_b2b, 0);
  const totalOrderItems = data.reduce((sum, row) => sum + row.total_order_items, 0);
  const totalPodBoxes = data.reduce((sum, row) => sum + row.pod_boxes_sold, 0);

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold text-gray-800">Product Performance Details</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Units</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalUnits)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">B2B Units</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalB2BUnits)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Order Items</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalOrderItems)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pod Boxes</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalPodBoxes)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 mt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-semibold text-gray-700 py-4">Product Name</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Units Ordered</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Units B2B</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Order Items</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Sales (₹)</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Avg Cost/Unit (₹)</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Pod Boxes Sold</TableHead>
                <TableHead className="font-semibold text-gray-700 py-4">Category</TableHead>
                <TableHead className="font-semibold text-gray-700 py-4">Sub-Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors py-4">
                  <TableCell className="font-medium text-gray-900 py-4">{row.product_name}</TableCell>
                  <TableCell className="text-right text-gray-700 py-4">{formatNumber(row.units_ordered)}</TableCell>
                  <TableCell className="text-right text-gray-700 py-4">{formatNumber(row.units_ordered_b2b)}</TableCell>
                  <TableCell className="text-right text-gray-700 py-4">{formatNumber(row.total_order_items)}</TableCell>
                  <TableCell className="text-right font-semibold text-gray-900 py-4">
                    {formatCurrency(row.ordered_product_sales)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-teal-600 py-4">
                    {formatCurrencyWithDecimals(row.average_cost_per_unit)}
                  </TableCell>
                  <TableCell className="text-right text-gray-700 py-4">
                    {row.pod_boxes_sold > 0 ? formatNumber(row.pod_boxes_sold) : '-'}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {row.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    {row.sub_category ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {row.sub_category}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No data to display. Try adjusting your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
