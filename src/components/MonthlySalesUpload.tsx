import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { UnmappedProductsModal } from './UnmappedProductsModal';
import { MainContentContainer } from './MainContentContainer';

interface SalesRow {
  '(Parent) ASIN'?: string;
  'SKU'?: string;
  'Units Ordered'?: number | string;
  'Units Ordered - B2B'?: number | string;
  'Total Order Items'?: number | string;
  'Ordered Product Sales'?: number | string;
  asin?: string;
  sku?: string;
  'asin/sku'?: string;
  units_ordered?: number;
  units_ordered_b2b?: number;
  total_order_items?: number;
  ordered_product_sales?: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2025, 2026, 2027];

interface UnmappedProduct {
  asin: string;
  sku: string;
  units_sold: number;
}

export function MonthlySalesUpload({ onDataUploaded }: { onDataUploaded: () => void }) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMappingData, setHasMappingData] = useState(false);
  const [unmappedProducts, setUnmappedProducts] = useState<UnmappedProduct[]>([]);
  const [showUnmappedModal, setShowUnmappedModal] = useState(false);
  const [pendingSalesData, setPendingSalesData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkMappingData();
  }, []);

  const checkMappingData = async () => {
    const { count } = await supabase
      .from('product_master_mapping')
      .select('*', { count: 'exact', head: true });

    setHasMappingData((count || 0) > 0);
  };

  const insertSalesData = async (validData: any[]) => {
    const { data: existing } = await supabase
      .from('amazon_monthly_sales')
      .select('id')
      .eq('report_month', selectedMonth)
      .eq('report_year', selectedYear);

    if (existing && existing.length > 0) {
      const { error: deleteError } = await supabase
        .from('amazon_monthly_sales')
        .delete()
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear);

      if (deleteError) throw deleteError;
    }

    const { error: insertError } = await supabase
      .from('amazon_monthly_sales')
      .insert(validData);

    if (insertError) throw insertError;

    setUploadedData(true);
    toast({
      title: 'Success!',
      description: `Successfully uploaded ${validData.length} sales records for ${selectedMonth} ${selectedYear}.`,
    });

    onDataUploaded();
    setUploading(false);
  };

  const handleUnmappedSaved = async () => {
    setShowUnmappedModal(false);
    setUploading(true);
    try {
      await insertSalesData(pendingSalesData);
    } catch (err) {
      console.error('Error inserting sales data:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload data');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Error',
        description: 'Please select both month and year before uploading.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setError(null);
    setUploadedData(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as SalesRow[];

          if (data.length === 0) {
            setError('The file is empty or invalid.');
            setUploading(false);
            return;
          }

          const salesData = data.map(row => {
            const asinOrSku =
              row['(Parent) ASIN'] ||
              row['SKU'] ||
              row['asin/sku'] ||
              row.asin ||
              row.sku ||
              '';

            const unitsOrdered =
              row['Units Ordered'] ||
              row.units_ordered ||
              '0';

            const unitsOrderedB2B =
              row['Units Ordered - B2B'] ||
              row.units_ordered_b2b ||
              '0';

            const totalOrderItems =
              row['Total Order Items'] ||
              row.total_order_items ||
              '0';

            const orderedProductSales =
              row['Ordered Product Sales'] ||
              row.ordered_product_sales ||
              '0';

            return {
              report_month: selectedMonth,
              report_year: selectedYear,
              asin_or_sku: String(asinOrSku).trim(),
              units_ordered: parseInt(String(unitsOrdered).replace(/,/g, '')) || 0,
              units_ordered_b2b: parseInt(String(unitsOrderedB2B).replace(/,/g, '')) || 0,
              total_order_items: parseInt(String(totalOrderItems).replace(/,/g, '')) || 0,
              ordered_product_sales: parseFloat(String(orderedProductSales).replace(/[₹,]/g, '')) || 0,
            };
          });

          const validData = salesData.filter(
            row => row.asin_or_sku && (row.units_ordered > 0 || row.ordered_product_sales > 0)
          );

          if (validData.length === 0) {
            setError('No valid sales data found in the file.');
            setUploading(false);
            return;
          }

          const uniqueAsins = Array.from(new Set(validData.map(d => d.asin_or_sku)));

          const { data: mappedProducts } = await supabase
            .from('product_master_mapping')
            .select('asin, sku')
            .in('asin', uniqueAsins);

          const { data: mappedBySkuProducts } = await supabase
            .from('product_master_mapping')
            .select('asin, sku')
            .in('sku', uniqueAsins);

          const mappedAsinSet = new Set([
            ...(mappedProducts?.map(p => p.asin) || []),
            ...(mappedProducts?.map(p => p.sku) || []),
            ...(mappedBySkuProducts?.map(p => p.asin) || []),
            ...(mappedBySkuProducts?.map(p => p.sku) || []),
          ]);

          const unmapped = validData
            .filter(d => !mappedAsinSet.has(d.asin_or_sku))
            .map(d => ({
              asin: d.asin_or_sku,
              sku: d.asin_or_sku,
              units_sold: d.units_ordered,
            }));

          const uniqueUnmapped = Array.from(
            new Map(unmapped.map(u => [u.asin, u])).values()
          );

          if (uniqueUnmapped.length > 0) {
            setPendingSalesData(validData);
            setUnmappedProducts(uniqueUnmapped);
            setShowUnmappedModal(true);
            setUploading(false);
            return;
          }

          await insertSalesData(validData);
        } catch (err) {
          console.error('Upload error:', err);
          setError(err instanceof Error ? err.message : 'Failed to upload data');
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setUploading(false);
      },
    });
  };

  if (!hasMappingData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Phase 2: Monthly Sales Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete Phase 1 (Master Product Mapping) before uploading monthly sales data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <MainContentContainer title="Monthly Sales Report Upload">
      <>
      <Card className="w-full max-w-2xl mx-auto border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload Sales Report
          </CardTitle>
          <CardDescription>
            Upload Amazon Business Report for a specific month and year
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadedData && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Data uploaded successfully! Click "View Monthly Dashboard" to analyze the data.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Month</label>
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
        </div>

        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading || !selectedMonth}
              className="hidden"
              id="sales-file-upload"
            />
            <label
              htmlFor="sales-file-upload"
              className={`cursor-pointer flex flex-col items-center ${
                !selectedMonth ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                {uploading ? 'Uploading...' : 'Click to upload sales report'}
              </p>
              <p className="text-xs text-gray-500">CSV or Excel format</p>
            </label>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold">Amazon Business Report Columns (Auto-mapped):</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>(Parent) ASIN or SKU</li>
              <li>Units Ordered</li>
              <li>Units Ordered - B2B</li>
              <li>Total Order Items</li>
              <li>Ordered Product Sales</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2 italic">
              Upload your Amazon Business Report directly - no formatting needed!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <UnmappedProductsModal
      open={showUnmappedModal}
      unmappedProducts={unmappedProducts}
      onClose={() => setShowUnmappedModal(false)}
      onSaved={handleUnmappedSaved}
    />
    </>
    </MainContentContainer>
  );
}
