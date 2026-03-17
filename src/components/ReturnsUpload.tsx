import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';
import { Upload, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, FileText, FileCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { MainContentContainer } from './MainContentContainer';
import { useDemoMode } from '../contexts/DemoModeContext';

interface ReturnsRow {
  'ASIN'?: string;
  'Units'?: number | string;
  'Return Type'?: string;
  'Return Reason'?: string;
  [key: string]: string | number | undefined;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2025, 2026, 2027];

export function ReturnsUpload({ onDataUploaded }: { onDataUploaded: () => void }) {
  const { isDemoMode } = useDemoMode();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMappingData, setHasMappingData] = useState(false);
  const [unmappedAsins, setUnmappedAsins] = useState<string[]>([]);
  const [flexFile, setFlexFile] = useState<File | null>(null);
  const [fbmFile, setFbmFile] = useState<File | null>(null);
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

  const parseFlexCSV = async (file: File): Promise<Map<string, number>> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as ReturnsRow[];
            const asinQuantityMap = new Map<string, number>();

            data.forEach(row => {
              const asin = (row['ASIN'] || '').toString().trim();
              const units = row['Units'] || '0';
              const parsedQuantity = parseInt(String(units).replace(/,/g, '')) || 0;

              if (asin && parsedQuantity > 0) {
                const currentQty = asinQuantityMap.get(asin) || 0;
                asinQuantityMap.set(asin, currentQty + parsedQuantity);
              }
            });

            resolve(asinQuantityMap);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  };

  const parseFBMXML = async (file: File): Promise<Map<string, number>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const xmlContent = e.target?.result as string;
          const parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true,
          });

          const parsedData = parser.parse(xmlContent);

          console.log('=' .repeat(80));
          console.log('🔍 FULL PARSED XML STRUCTURE:');
          console.log(JSON.stringify(parsedData, null, 2));
          console.log('=' .repeat(80));

          // Step 1: Adaptive Path Finder - Find the Message node(s)
          let rawMessages = null;

          if (parsedData.AmazonEnvelope && parsedData.AmazonEnvelope.Message) {
            console.log('✅ Found path: parsedData.AmazonEnvelope.Message');
            rawMessages = parsedData.AmazonEnvelope.Message;
          } else if (parsedData.Message) {
            console.log('✅ Found path: parsedData.Message (parser skipped root tag)');
            rawMessages = parsedData.Message;
          } else {
            console.error('❌ Could not find Message node in parsed XML');
            console.error('Available top-level keys:', Object.keys(parsedData));
            if (parsedData.AmazonEnvelope) {
              console.error('Keys inside AmazonEnvelope:', Object.keys(parsedData.AmazonEnvelope));
            }
            throw new Error('Invalid XML structure: No Message node found');
          }

          // Step 2: Normalize to Array (Handle Single Item Edge Case)
          const messagesArray = Array.isArray(rawMessages)
            ? rawMessages
            : (rawMessages ? [rawMessages] : []);

          console.log(`📦 Found Messages count: ${messagesArray.length}`);
          console.log(`📦 Messages are ${Array.isArray(rawMessages) ? 'ARRAY' : 'SINGLE OBJECT (normalized to array)'}`);

          if (messagesArray.length === 0) {
            console.warn('⚠️ Messages array is empty after normalization');
            resolve(new Map<string, number>());
            return;
          }

          const asinQuantityMap = new Map<string, number>();
          const extractedRecords: Array<{ asin: string; quantity: number }> = [];

          // Step 3: Extract Returns from Each Message
          messagesArray.forEach((msg: any, index: number) => {
            try {
              console.log(`\n📨 Processing Message ${index + 1}/${messagesArray.length}:`);

              // return_details is an ARRAY of return records
              const returnDetailsArray = msg.return_details;

              if (!returnDetailsArray || !Array.isArray(returnDetailsArray)) {
                console.warn(`   ⚠️ Message ${index + 1} skipped: return_details is not an array`);
                console.warn(`   Available keys in message:`, Object.keys(msg));
                return;
              }

              console.log(`   ✅ Found ${returnDetailsArray.length} return records in Message ${index + 1}`);

              // Process each return record in the array
              returnDetailsArray.forEach((returnDetail: any, returnIndex: number) => {
                try {
                  const details = returnDetail.item_details;

                  if (!details) {
                    console.warn(`     ⚠️ Return ${returnIndex + 1} skipped: No item_details found`);
                    return;
                  }

                  // Extract ASIN and quantity
                  const asin = details.asin?.toString().trim();
                  const quantity = parseInt(details.return_quantity || '0', 10);

                  console.log(`     📄 Return ${returnIndex + 1}: ASIN="${asin}", Quantity=${quantity}`);

                  if (!asin) {
                    console.warn(`     ⚠️ Return ${returnIndex + 1} skipped: ASIN is missing`);
                    return;
                  }

                  if (quantity <= 0) {
                    console.warn(`     ⚠️ Return ${returnIndex + 1} skipped: Invalid quantity (${quantity})`);
                    return;
                  }

                  // Add to map
                  const currentQty = asinQuantityMap.get(asin) || 0;
                  asinQuantityMap.set(asin, currentQty + quantity);
                  extractedRecords.push({ asin, quantity });

                  console.log(`     ✅ Added: ${asin} -> ${quantity} (Total: ${currentQty + quantity})`);

                } catch (err) {
                  console.error(`     ❌ Error parsing return ${returnIndex + 1}:`, err);
                }
              });

            } catch (err) {
              console.error(`   ❌ Error parsing Message ${index + 1}:`, err);
              return;
            }
          });

          console.log('\n' + '='.repeat(80));
          console.log('✅ EXTRACTION COMPLETE');
          console.log(`📊 Total unique ASINs found: ${asinQuantityMap.size}`);
          console.log('📋 Extracted FBM Records:', extractedRecords);
          console.log('🗂️ Final Aggregated Map:', Array.from(asinQuantityMap.entries()));
          console.log('='.repeat(80));

          if (asinQuantityMap.size === 0) {
            console.warn('⚠️ WARNING: No valid FBM return records extracted from XML!');
          }

          resolve(asinQuantityMap);
        } catch (err) {
          console.error('❌ FBM XML PARSING ERROR:', err);
          reject(new Error('Could not parse XML. Please ensure it follows the standard Amazon Return Feed structure.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read XML file'));
      };

      reader.readAsText(file);
    });
  };

  const handleProcessReturns = async () => {
    if (!flexFile && !fbmFile) {
      toast({
        title: 'Error',
        description: 'Please upload at least one returns file (FLEX CSV or FBM XML).',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Error',
        description: 'Please select both month and year before processing.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setError(null);
    setUploadedData(false);
    setUnmappedAsins([]);

    try {
      console.log('🚀 Starting Returns Processing...');
      console.log(`📅 Month: ${selectedMonth} ${selectedYear}`);
      console.log(`📁 Files: FLEX=${!!flexFile}, FBM=${!!fbmFile}`);

      const consolidatedMap = new Map<string, number>();

      if (flexFile) {
        console.log('📊 Processing FLEX CSV...');
        const flexData = await parseFlexCSV(flexFile);
        console.log(`✅ FLEX Data Extracted: ${flexData.size} unique ASINs`);
        console.log('📋 FLEX Records:', Array.from(flexData.entries()));

        flexData.forEach((qty, asin) => {
          const current = consolidatedMap.get(asin) || 0;
          consolidatedMap.set(asin, current + qty);
          console.log(`   FLEX: ${asin} -> ${qty} (Consolidated Total: ${current + qty})`);
        });
      }

      if (fbmFile) {
        console.log('📊 Processing FBM XML...');
        const fbmData = await parseFBMXML(fbmFile);
        console.log(`✅ FBM Data Extracted: ${fbmData.size} unique ASINs`);
        console.log('📋 FBM Records:', Array.from(fbmData.entries()));

        fbmData.forEach((qty, asin) => {
          const current = consolidatedMap.get(asin) || 0;
          consolidatedMap.set(asin, current + qty);
          console.log(`   FBM: ${asin} -> ${qty} (Consolidated Total: ${current + qty})`);
        });
      }

      console.log('🔗 Final Consolidated Data:', Array.from(consolidatedMap.entries()));
      console.log(`📊 Total Unique ASINs: ${consolidatedMap.size}`);

      if (consolidatedMap.size === 0) {
        console.error('❌ No valid returns data found after processing');
        setError('No valid returns data found in the uploaded files.');
        setUploading(false);
        return;
      }

      const uniqueAsins = Array.from(consolidatedMap.keys());

      const { data: mappedProducts } = await supabase
        .from('product_master_mapping')
        .select('asin')
        .in('asin', uniqueAsins);

      const mappedAsinSet = new Set(mappedProducts?.map(p => p.asin) || []);

      const unmapped = uniqueAsins.filter(asin => !mappedAsinSet.has(asin));
      if (unmapped.length > 0) {
        setUnmappedAsins(unmapped);
      }

      const returnsData = Array.from(consolidatedMap.entries()).map(([asin, quantity]) => ({
        report_month: selectedMonth,
        report_year: selectedYear,
        asin: asin,
        quantity_returned: quantity,
      }));

      console.log('💾 Preparing to save to database:', returnsData.length, 'records');
      console.log('📄 Sample records:', returnsData.slice(0, 5));

      const { data: existing } = await supabase
        .from('amazon_monthly_returns')
        .select('id')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear);

      if (existing && existing.length > 0) {
        console.log(`🗑️ Deleting ${existing.length} existing records for ${selectedMonth} ${selectedYear}`);
        const { error: deleteError } = await supabase
          .from('amazon_monthly_returns')
          .delete()
          .eq('report_month', selectedMonth)
          .eq('report_year', selectedYear);

        if (deleteError) {
          console.error('❌ Delete error:', deleteError);
          throw deleteError;
        }
        console.log('✅ Old records deleted successfully');
      }

      console.log('💾 Inserting consolidated returns data...');
      const { error: insertError } = await supabase
        .from('amazon_monthly_returns')
        .insert(returnsData);

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }
      console.log('✅ Returns data inserted successfully');

      console.log('🏷️ Updating data sources tracking...');
      const { data: existingSource } = await supabase
        .from('returns_data_sources')
        .select('id')
        .eq('report_month', selectedMonth)
        .eq('report_year', selectedYear)
        .maybeSingle();

      const sourceTracking = {
        has_flex_data: !!flexFile,
        has_fbm_data: !!fbmFile,
      };
      console.log('📊 Source tracking flags:', sourceTracking);

      if (existingSource) {
        console.log('🔄 Updating existing source tracking record');
        const { error: updateError } = await supabase
          .from('returns_data_sources')
          .update(sourceTracking)
          .eq('report_month', selectedMonth)
          .eq('report_year', selectedYear);

        if (updateError) {
          console.error('❌ Source tracking update error:', updateError);
          throw updateError;
        }
        console.log('✅ Source tracking updated');
      } else {
        console.log('➕ Creating new source tracking record');
        const { error: insertSourceError } = await supabase
          .from('returns_data_sources')
          .insert({
            report_month: selectedMonth,
            report_year: selectedYear,
            ...sourceTracking,
          });

        if (insertSourceError) {
          console.error('❌ Source tracking insert error:', insertSourceError);
          throw insertSourceError;
        }
        console.log('✅ Source tracking created');
      }

      setUploadedData(true);
      const sourceInfo = flexFile && fbmFile
        ? 'both FLEX and FBM'
        : flexFile
        ? 'FLEX'
        : 'FBM';

      console.log('🎉 Upload Complete!');
      console.log(`✅ Successfully processed ${returnsData.length} returns records from ${sourceInfo}`);
      console.log(`📅 Period: ${selectedMonth} ${selectedYear}`);

      toast({
        title: 'Success!',
        description: `Successfully uploaded ${returnsData.length} returns records from ${sourceInfo} for ${selectedMonth} ${selectedYear}.`,
      });

      setFlexFile(null);
      setFbmFile(null);
      onDataUploaded();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload data');
    } finally {
      setUploading(false);
    }
  };

  if (!hasMappingData) {
    return (
      <MainContentContainer title="Returns Report Upload">
        <Card className="w-full max-w-2xl mx-auto border border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle>Returns Report Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete Phase 1 (Master Product Mapping) before uploading returns data.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </MainContentContainer>
    );
  }

  return (
    <MainContentContainer title="Returns Report Upload">
      <Card className="w-full max-w-4xl mx-auto border border-gray-200 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Returns Report Upload - Dual Data Sources
        </CardTitle>
        <CardDescription>
          Upload FLEX Returns (CSV) and/or FBM Returns (XML) for consolidated analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
              Returns data uploaded successfully! View the Returns Analysis tab to analyze return rates.
            </AlertDescription>
          </Alert>
        )}

        {unmappedAsins.length > 0 && (
          <Alert className="border-amber-500 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Warning:</strong> {unmappedAsins.length} ASIN(s) not found in product mapping.
              They will be labeled as "Unknown Product" in reports.
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold">View unmapped ASINs</summary>
                <ul className="list-disc list-inside mt-2 text-xs">
                  {unmappedAsins.slice(0, 10).map((asin, i) => (
                    <li key={i}>{asin}</li>
                  ))}
                  {unmappedAsins.length > 10 && <li>... and {unmappedAsins.length - 10} more</li>}
                </ul>
              </details>
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

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              FLEX Returns (CSV)
            </label>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-blue-50/30">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFlexFile(e.target.files?.[0] || null)}
                disabled={uploading || !selectedMonth}
                className="hidden"
                id="flex-file-upload"
              />
              <label
                htmlFor="flex-file-upload"
                className={`cursor-pointer flex flex-col items-center ${
                  !selectedMonth ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FileText className="w-10 h-10 text-blue-500 mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {flexFile ? flexFile.name : 'Click to upload FLEX CSV'}
                </p>
                <p className="text-xs text-gray-500">Optional</p>
              </label>
              {flexFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlexFile(null);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-semibold">Expected Format:</p>
              <ul className="list-disc list-inside pl-2">
                <li>ASIN - Product ID</li>
                <li>Units - Quantity returned</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              FBM Returns (XML)
            </label>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors bg-green-50/30">
              <input
                type="file"
                accept=".xml"
                onChange={(e) => setFbmFile(e.target.files?.[0] || null)}
                disabled={uploading || !selectedMonth}
                className="hidden"
                id="fbm-file-upload"
              />
              <label
                htmlFor="fbm-file-upload"
                className={`cursor-pointer flex flex-col items-center ${
                  !selectedMonth ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FileCode className="w-10 h-10 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {fbmFile ? fbmFile.name : 'Click to upload FBM XML'}
                </p>
                <p className="text-xs text-gray-500">Optional</p>
              </label>
              {fbmFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFbmFile(null);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-semibold">Expected Structure:</p>
              <ul className="list-disc list-inside pl-2">
                <li>AmazonEnvelope → Message</li>
                <li>return_details[] → item_details</li>
                <li>Each item has: asin, return_quantity</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 pt-4">
          <Button
            onClick={handleProcessReturns}
            disabled={uploading || !selectedMonth || (!flexFile && !fbmFile) || isDemoMode}
            size="lg"
            className={`px-8 ${isDemoMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? 'Processing...' : 'Process Returns'}
          </Button>
          {isDemoMode && (
            <p className="text-xs text-amber-600 font-medium">Upload disabled in Demo Mode.</p>
          )}
        </div>

        <Alert className="border-blue-500 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Note:</strong> You can upload one or both files for the selected month.
            If both are uploaded, the system will automatically consolidate and aggregate returns data by ASIN.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
    </MainContentContainer>
  );
}
