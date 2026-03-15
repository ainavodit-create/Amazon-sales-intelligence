import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ProductData {
  product_name: string;
  category: string;
  units_ordered: number;
  ordered_product_sales: number;
}

interface TrendHighlightCardsProps {
  currentData: ProductData[];
  benchmarkData: ProductData[];
}

export function TrendHighlightCards({ currentData, benchmarkData }: TrendHighlightCardsProps) {
  const trends = useMemo(() => {
    const benchmarkMap = new Map(
      benchmarkData.map(p => [p.product_name, p])
    );

    const comparisons = currentData.map(current => {
      const benchmark = benchmarkMap.get(current.product_name);
      const benchmarkUnits = benchmark?.units_ordered || 0;
      const variance = current.units_ordered - benchmarkUnits;
      const isNew = !benchmark || benchmarkUnits === 0;

      return {
        product_name: current.product_name,
        category: current.category,
        current_units: current.units_ordered,
        benchmark_units: benchmarkUnits,
        variance,
        variance_percent: benchmarkUnits > 0 ? (variance / benchmarkUnits) * 100 : 0,
        is_new: isNew,
      };
    });

    const topGainer = comparisons
      .filter(c => !c.is_new && c.variance > 0)
      .sort((a, b) => b.variance - a.variance)[0];

    const biggestDrop = comparisons
      .filter(c => !c.is_new && c.variance < 0)
      .sort((a, b) => a.variance - b.variance)[0];

    const successfulLaunch = comparisons
      .filter(c => c.is_new)
      .sort((a, b) => b.current_units - a.current_units)[0];

    return { topGainer, biggestDrop, successfulLaunch };
  }, [currentData, benchmarkData]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            Top Gainer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends.topGainer ? (
            <div className="space-y-2">
              <p className="font-bold text-lg text-gray-900 line-clamp-2">
                {trends.topGainer.product_name}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  +{formatNumber(trends.topGainer.variance)}
                </span>
                <span className="text-sm text-gray-600">units</span>
              </div>
              <p className="text-sm text-green-700 font-semibold">
                +{trends.topGainer.variance_percent.toFixed(1)}% increase
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {trends.topGainer.category}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No gains detected</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <div className="p-2 rounded-full bg-red-100">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            Biggest Drop
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends.biggestDrop ? (
            <div className="space-y-2">
              <p className="font-bold text-lg text-gray-900 line-clamp-2">
                {trends.biggestDrop.product_name}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">
                  {formatNumber(trends.biggestDrop.variance)}
                </span>
                <span className="text-sm text-gray-600">units</span>
              </div>
              <p className="text-sm text-red-700 font-semibold">
                {trends.biggestDrop.variance_percent.toFixed(1)}% decrease
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {trends.biggestDrop.category}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No drops detected</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            Successful Launch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends.successfulLaunch ? (
            <div className="space-y-2">
              <p className="font-bold text-lg text-gray-900 line-clamp-2">
                {trends.successfulLaunch.product_name}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {formatNumber(trends.successfulLaunch.current_units)}
                </span>
                <span className="text-sm text-gray-600">units sold</span>
              </div>
              <p className="text-sm text-blue-700 font-semibold">
                New product launch
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {trends.successfulLaunch.category}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No new launches</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
