import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { MainContentContainer } from './MainContentContainer';
import { useDemoMode } from '../contexts/DemoModeContext';

interface MappingRow {
  asin: string;
  sku: string;
  product_name: string;
  bundle_contents?: string;
  category: string;
  sub_category?: string;
  pod_boxes_in_pack?: number;
}

export function MasterMappingUpload() {
  const { isDemoMode } = useDemoMode();
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as MappingRow[];

          if (data.length === 0) {
            setError('The file is empty or invalid.');
            setUploading(false);
            return;
          }

          const mappingData = data.map(row => ({
            asin: row.asin?.trim() || '',
            sku: row.sku?.trim() || '',
            product_name: row.product_name?.trim() || '',
            bundle_contents: row.bundle_contents?.trim() || null,
            category: row.category?.trim() || '',
            sub_category: row.sub_category?.trim() || null,
            pod_boxes_in_pack: parseInt(String(row.pod_boxes_in_pack || '0')) || 0,
          }));

          const validData = mappingData.filter(
            row => row.asin && row.sku && row.product_name && row.category
          );

          if (validData.length === 0) {
            setError('No valid rows found. Please check your CSV format.');
            setUploading(false);
            return;
          }

          for (const row of validData) {
            const { data: existing } = await supabase
              .from('product_master_mapping')
              .select('id')
              .or(`asin.eq.${row.asin},sku.eq.${row.sku}`)
              .maybeSingle();

            if (existing) {
              const { error: updateError } = await supabase
                .from('product_master_mapping')
                .update(row)
                .eq('id', existing.id);

              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from('product_master_mapping')
                .insert([row]);

              if (insertError) throw insertError;
            }
          }

          setSuccess(true);
          toast({
            title: 'Success!',
            description: `Product Master Mapping Complete. ${validData.length} products uploaded. Ready for Monthly Reports.`,
          });
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

  return (
    <MainContentContainer title="Master Product Mapping">
      <Card className="w-full max-w-2xl mx-auto border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload Master Mapping
          </CardTitle>
          <CardDescription>
            One-time setup: Upload your product master mapping file (CSV format)
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Product Master Mapping Complete. Ready for Monthly Reports.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDemoMode
              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading || isDemoMode}
              className="hidden"
              id="mapping-file-upload"
            />
            <label
              htmlFor="mapping-file-upload"
              className={`flex flex-col items-center ${isDemoMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                {uploading ? 'Uploading...' : 'Click to upload mapping file'}
              </p>
              <p className="text-xs text-gray-500">CSV or Excel format</p>
            </label>
          </div>
          {isDemoMode && (
            <p className="text-xs text-amber-600 text-center font-medium">Upload disabled in Demo Mode.</p>
          )}

          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold">Required columns:</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>asin</li>
              <li>sku</li>
              <li>product_name</li>
              <li>category</li>
              <li>pod_boxes_in_pack (required for Coffee pods category)</li>
            </ul>
            <p className="mt-2 font-semibold">Optional columns:</p>
            <ul className="list-disc list-inside pl-2">
              <li>bundle_contents</li>
              <li>sub_category</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
    </MainContentContainer>
  );
}
