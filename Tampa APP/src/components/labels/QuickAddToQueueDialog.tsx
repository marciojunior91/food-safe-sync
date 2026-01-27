// QuickAddToQueueDialog - Quick modal to add product to print queue
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePrintQueue } from '@/hooks/usePrintQueue';
import { LabelData } from './LabelForm';

interface Product {
  id: string;
  name: string;
  category_id?: string;
  subcategory_id?: string;
  label_categories?: {
    id: string;
    name: string;
  };
  measuring_units?: {
    name: string;
    abbreviation: string;
  };
}

interface QuickAddToQueueDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddToQueueDialog({ 
  product, 
  open, 
  onOpenChange
}: QuickAddToQueueDialogProps) {
  const { addToQueue } = usePrintQueue();
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!product) return;

    // ✅ FIXED: Team member will be selected at print time, not at add time
    // This makes the workflow consistent with Quick Print and Full Form workflows
    
    // Create default label data WITHOUT team member info
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expiryDate = tomorrow.toISOString().split('T')[0];

    const labelData: LabelData = {
      categoryId: product.category_id || product.label_categories?.id || "",
      categoryName: product.label_categories?.name || "Uncategorized",
      subcategoryId: undefined,
      subcategoryName: undefined,
      productId: product.id,
      productName: product.name,
      condition: "Fresh",
      preparedBy: "", // ✅ Empty - will be filled when printing
      preparedByName: "", // ✅ Empty - will be filled when printing
      prepDate: today,
      expiryDate,
      quantity: quantity.toString(),
      unit: product.measuring_units?.abbreviation || "units",
      batchNumber: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    addToQueue(labelData, quantity);
    onOpenChange(false);
    setQuantity(1); // Reset quantity
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
      setQuantity(newQuantity);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Print Queue</DialogTitle>
          <DialogDescription>
            Add {product?.name} to your print queue with today's date and tomorrow's expiry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="space-y-2">
            <Label>Product</Label>
            <div className="text-sm font-medium">{product?.name}</div>
            {product?.label_categories && (
              <div className="text-xs text-muted-foreground">
                Category: {product.label_categories.name}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Number of Labels</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <Input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 100) {
                    setQuantity(val);
                  }
                }}
                className="text-center text-lg font-semibold w-24"
              />
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 100}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Max 100 labels per item
            </p>
          </div>

          {/* Default Values Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium">Default Values:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Prep Date: Today</li>
              <li>• Expiry Date: Tomorrow</li>
              <li>• Condition: Fresh</li>
            </ul>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
              ⚠️ Edit dates in the queue before printing if needed
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="hero" onClick={handleAdd} className="text-white">
            Add {quantity} Label{quantity > 1 ? 's' : ''} to Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
