// Quick Print Details Dialog - Lightweight form for quick print fields
// Appears after team member selection, before printing
// Collects only essential fields: quantity, unit, condition

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Scale, Thermometer } from "lucide-react";
import { addDays, format } from "date-fns";

export interface QuickPrintDetails {
  quantity: string;
  unit: string;
  condition: string;
  customExpiryDate?: string;
}

interface QuickPrintDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (details: QuickPrintDetails) => void;
  productName: string;
}

export function QuickPrintDetailsDialog({
  open,
  onOpenChange,
  onConfirm,
  productName
}: QuickPrintDetailsDialogProps) {
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("Unit");
  const [condition, setCondition] = useState("refrigerated");
  const [customExpiryDate, setCustomExpiryDate] = useState(
    format(addDays(new Date(), 3), 'yyyy-MM-dd')
  );

  const handleConfirm = () => {
    onConfirm({
      quantity,
      unit,
      condition,
      customExpiryDate: condition === 'custom' ? customExpiryDate : undefined,
    });
    
    // Reset for next use
    setQuantity("1");
    setUnit("Unit");
    setCondition("refrigerated");
    setCustomExpiryDate(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset
    setQuantity("1");
    setUnit("Unit");
    setCondition("refrigerated");
    setCustomExpiryDate(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-width-[425px]">
        <DialogHeader>
          <DialogTitle>Quick Print - Additional Details</DialogTitle>
          <DialogDescription>
            Complete the details for <span className="font-semibold">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Quantity */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right flex items-center gap-1">
              <Package className="h-4 w-4" />
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Unit */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right flex items-center gap-1">
              <Scale className="h-4 w-4" />
              Unit
            </Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unit">Unit</SelectItem>
                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                <SelectItem value="g">Gram (g)</SelectItem>
                <SelectItem value="L">Liter (L)</SelectItem>
                <SelectItem value="mL">Milliliter (mL)</SelectItem>
                <SelectItem value="lb">Pound (lb)</SelectItem>
                <SelectItem value="oz">Ounce (oz)</SelectItem>
                <SelectItem value="Portion">Portion</SelectItem>
                <SelectItem value="Box">Box</SelectItem>
                <SelectItem value="Bag">Bag</SelectItem>
                <SelectItem value="Container">Container</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="condition" className="text-right flex items-center gap-1">
              <Thermometer className="h-4 w-4" />
              Condition
            </Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fresh">🌿 Fresh</SelectItem>
                <SelectItem value="cooked">🍳 Cooked</SelectItem>
                <SelectItem value="frozen">❄️ Frozen</SelectItem>
                <SelectItem value="dry">🌾 Dry Storage</SelectItem>
                <SelectItem value="refrigerated">🧊 Refrigerated</SelectItem>
                <SelectItem value="ambient">🌡️ Room Temperature</SelectItem>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="thawed">💧 Thawed</SelectItem>
                <SelectItem value="custom">📅 Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Expiry Date — visible only when condition === 'custom' */}
          {condition === 'custom' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customExpiry" className="text-right text-sm">
                Expiry Date
              </Label>
              <Input
                id="customExpiry"
                type="date"
                value={customExpiryDate}
                onChange={(e) => setCustomExpiryDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Package className="h-4 w-4" />
            Print Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
