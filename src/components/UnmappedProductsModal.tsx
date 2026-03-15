import { useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';

interface UnmappedProduct {
  asin: string;
  sku: string;
  units_sold: number;
}

interface ProductInput {
  asin: string;
  sku: string;
  product_name: string;
  category: string;
  sub_category: string;
  pod_boxes_in_pack: number;
}

interface UnmappedProductsModalProps {
  open: boolean;
  unmappedProducts: UnmappedProduct[];
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ['Coffee Pods', 'Coffee Beans', 'Coffee Machines', 'Equipments', 'Accessories'];

export function UnmappedProductsModal({
  open,
  unmappedProducts,
  onClose,
  onSaved,
}: UnmappedProductsModalProps) {
  const [productInputs, setProductInputs] = useState<Record<string, ProductInput>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (asin: string, field: keyof ProductInput, value: string | number) => {
    setProductInputs(prev => ({
      ...prev,
      [asin]: {
        ...prev[asin],
        asin,
        sku: unmappedProducts.find(p => p.asin === asin)?.sku || '',
        [field]: value,
      },
    }));
  };

  const handleSaveAndContinue = async () => {
    const inputs = Object.values(productInputs);

    const missingData = unmappedProducts.filter(p => {
      const input = productInputs[p.asin];
      return !input || !input.product_name || !input.category;
    });

    if (missingData.length > 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in Product Name and Category for all unmapped products.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const mappingData = inputs.map(input => ({
        asin: input.asin,
        sku: input.sku,
        product_name: input.product_name,
        category: input.category,
        sub_category: input.sub_category || null,
        bundle_contents: null,
        pod_boxes_in_pack: input.category.toLowerCase() === 'coffee pods' ? input.pod_boxes_in_pack || 1 : 0,
      }));

      const { error } = await supabase
        .from('product_master_mapping')
        .insert(mappingData);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `${mappingData.length} new products added to master mapping.`,
      });

      onSaved();
    } catch (error) {
      console.error('Error saving unmapped products:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product mappings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-6 h-6" />
            New Products Detected
          </DialogTitle>
          <DialogDescription>
            The following ASINs were not found in your product master mapping. Please provide
            product details before proceeding to the dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ASIN</TableHead>
                <TableHead className="w-[120px]">SKU</TableHead>
                <TableHead className="w-[80px] text-right">Units Sold</TableHead>
                <TableHead>Product Name *</TableHead>
                <TableHead className="w-[150px]">Category *</TableHead>
                <TableHead className="w-[130px]">Sub-Category</TableHead>
                <TableHead className="w-[100px]">Pod Boxes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmappedProducts.map(product => {
                const input = productInputs[product.asin] || {};
                const isCoffeePods = input.category?.toLowerCase() === 'coffee pods';

                return (
                  <TableRow key={product.asin}>
                    <TableCell className="font-mono text-xs">{product.asin}</TableCell>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="text-right font-semibold">{product.units_sold}</TableCell>
                    <TableCell>
                      <Input
                        placeholder="Enter product name"
                        value={input.product_name || ''}
                        onChange={e => handleInputChange(product.asin, 'product_name', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={input.category || ''}
                        onValueChange={value => handleInputChange(product.asin, 'category', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional"
                        value={input.sub_category || ''}
                        onChange={e => handleInputChange(product.asin, 'sub_category', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="1"
                        disabled={!isCoffeePods}
                        value={input.pod_boxes_in_pack || ''}
                        onChange={e =>
                          handleInputChange(product.asin, 'pod_boxes_in_pack', parseInt(e.target.value) || 0)
                        }
                        className="h-8"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndContinue} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
