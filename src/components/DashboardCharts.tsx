import { useMemo } from 'react';
import { DashboardRow } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardChartsProps {
  data: DashboardRow[];
}

const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export function DashboardCharts({ data }: DashboardChartsProps) {
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    data.forEach(row => {
      const current = categoryMap.get(row.category) || 0;
      categoryMap.set(row.category, current + row.ordered_product_sales);
    });

    const sorted = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return sorted;
  }, [data]);

  const topProductsData = useMemo(() => {
    const sorted = [...data]
      .sort((a, b) => b.units_ordered - a.units_ordered)
      .slice(0, 10)
      .map(row => ({
        name: row.product_name.length > 30
          ? row.product_name.substring(0, 30) + '...'
          : row.product_name,
        units: row.units_ordered,
      }));

    return sorted;
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {typeof payload[0].value === 'number' && payload[0].value > 1000
              ? formatCurrency(payload[0].value)
              : formatNumber(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Sales by Category (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => value}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Top 10 Products by Units Ordered</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData} layout="vertical">
              <CartesianGrid strokeDasharray="none" stroke="#f0f0f0" vertical={false} />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="units" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
