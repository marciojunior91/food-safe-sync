/**
 * Recipe Print Dialog
 * Dialog for printing labels from recipes
 * Features: batch size multiplier, team member selection, auto expiry calculation
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Printer, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePrinter } from '@/hooks/usePrinter';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';
import type { RecipePrintData } from '@/types/recipePrint';
import { calculateExpiryDate, type StorageCondition } from '@/utils/dateCalculations';

interface RecipePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: {
    id: string;
    name: string;
    shelf_life_days?: number;
    allergens?: Array<{ id: string; name: string }>;
  };
  initialUser?: { id: string; display_name: string } | null;
}

export function RecipePrintDialog({ open, onOpenChange, recipe, initialUser }: RecipePrintDialogProps) {
  const { toast } = useToast();
  const { printer, print, availablePrinters, changePrinter } = usePrinter('recipe-print');
  
  const [loading, setLoading] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; display_name: string } | null>(initialUser || null);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(printer?.type || 'zebra');
  
  // Form state
  const [batchMultiplier, setBatchMultiplier] = useState(1);
  const [batchCustom, setBatchCustom] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState(new Date());
  const [storageCondition, setStorageCondition] = useState<StorageCondition>('refrigerated');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  
  // Category IDs for "Prepared Foods → Recipes"
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  
  // Calculate expiry date - recalculates reactively when storageCondition or date changes
  const baseShelfLifeDays = recipe.shelf_life_days || 3;
  const shelfLifeDays = baseShelfLifeDays;
  const expiryDateString = calculateExpiryDate(
    format(manufacturingDate, 'yyyy-MM-dd'),
    storageCondition,
    shelfLifeDays
  );
  const expiryDate = expiryDateString ? parseISO(expiryDateString) : new Date();
  const CONDITION_MULTIPLIERS: Record<string, number> = { fresh: 0.33, cooked: 1, frozen: 4, dry: 10, refrigerated: 1, ambient: 0.5, hot: 0.05, thawed: 0.33 };
  const effectiveDays = Math.max(Math.ceil(shelfLifeDays * (CONDITION_MULTIPLIERS[storageCondition] ?? 1)), 1);

  // Update selectedUser when initialUser changes
  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
    }
  }, [initialUser]);

  // Load category and subcategory IDs
  useEffect(() => {
    async function loadCategories() {
      const { data: category, error: catError } = await supabase
        .from('label_categories')
        .select('id')
        .eq('name', 'Prepared Foods')
        .single();

      if (catError || !category) {
        console.error('Failed to load Prepared Foods category:', catError);
        return;
      }

      setCategoryId(category.id);
      
      // Get "Recipes" subcategory
      const { data: subcategory, error: subError } = await supabase
        .from('label_subcategories')
        .select('id')
        .eq('category_id', category.id)
        .eq('name', 'Recipes')
        .single();

      if (subError || !subcategory) {
        console.error('Failed to load Recipes subcategory:', subError);
        return;
      }

      setSubcategoryId(subcategory.id);
    }

    if (open) {
      loadCategories();
    }
  }, [open]);

  const handlePrint = async () => {
    if (!selectedUser) {
      setUserDialogOpen(true);
      return;
    }

    if (!categoryId || !subcategoryId) {
      toast({
        title: 'Configuration Error',
        description: 'Recipe category not configured. Please run the migration first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare label data matching printer expectations (IncomingLabelData interface)
      const labelData = {
        productName: `${recipe.name}${batchMultiplier !== 1 ? ` (${batchMultiplier === 0 ? batchCustom : batchMultiplier}x)` : ''}`,
        prepDate: format(manufacturingDate, 'yyyy-MM-dd'),
        expiryDate: format(expiryDate, 'yyyy-MM-dd'),
        condition: storageCondition,
        allergens: (recipe.allergens || []).map(a => ({
          id: a.id,
          name: a.name,
          icon: null as string | null,
          severity: 'moderate',
        })),
        preparedByName: selectedUser.display_name,
        categoryId,
        subcategoryId,
        categoryName: 'Prepared Foods',
        subcategoryName: 'Recipes',
        quantity: quantity || undefined,
        unit: unit || undefined,
      };


      // Print the label
      await print(labelData);

      toast({
        title: 'Label Printed!',
        description: `Recipe label for ${recipe.name} has been sent to ${printer?.name || 'printer'}`,
      });

      onOpenChange(false);

    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: 'Print Failed',
        description: error.message || 'Failed to print recipe label',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: { id: string; display_name: string }) => {
    setSelectedUser(user);
    setUserDialogOpen(false);
    // Don't auto-print - let user click Print button
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Recipe Label</DialogTitle>
            <DialogDescription>
              Create a label for {recipe.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Batch Multiplier */}
            <div className="space-y-2">
              <Label>Batch Size</Label>
              <Select 
                value={batchMultiplier.toString()} 
                onValueChange={(v) => setBatchMultiplier(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x (Standard)</SelectItem>
                  <SelectItem value="2">2x (Double)</SelectItem>
                  <SelectItem value="3">3x (Triple)</SelectItem>
                  <SelectItem value="0">Other...</SelectItem>
                </SelectContent>
              </Select>
              {batchMultiplier === 0 && (
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter batch multiplier"
                  value={batchCustom}
                  onChange={(e) => setBatchCustom(e.target.value)}
                />
              )}
            </div>

            {/* Prep Date */}
            <div className="space-y-2">
              <Label>Prep Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !manufacturingDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {manufacturingDate ? format(manufacturingDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={manufacturingDate}
                    onSelect={(date) => date && setManufacturingDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Expiry Date (Calculated) */}
            <div className="space-y-2">
              <Label>Expiry Date (Auto-calculated)</Label>
              <Input
                value={format(expiryDate, 'PPP')}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {effectiveDays} day{effectiveDays !== 1 ? 's' : ''} shelf life under {storageCondition === 'ambient' ? 'room temperature' : storageCondition} conditions
              </p>
            </div>

            {/* Storage Condition */}
            <div className="space-y-2">
              <Label>Storage Condition</Label>
              <Select 
                value={storageCondition} 
                onValueChange={(v: StorageCondition) => setStorageCondition(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambient">Room Temperature</SelectItem>
                  <SelectItem value="refrigerated">Refrigerated</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changes shelf life calculation
              </p>
            </div>

            {/* Optional: Quantity & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g., 500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit (Optional)</Label>
                <Input
                  placeholder="e.g., g, ml"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>

            {/* Selected User Display */}
            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Prepared By:</p>
                <p className="text-sm text-muted-foreground">{selectedUser.display_name}</p>
              </div>
            )}

            {/* Printer Selection */}
            <div className="space-y-2">
              <Label>Printer</Label>
              <Select 
                value={selectedPrinter} 
                onValueChange={(value) => {
                  setSelectedPrinter(value);
                  changePrinter(value as any);
                }}
                disabled={import.meta.env.PROD}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zebra">🦓 Zebra Thermal Printer</SelectItem>
                  <SelectItem value="generic">🖨️ Generic Printer</SelectItem>
                  <SelectItem value="pdf">📄 PDF Export</SelectItem>
                </SelectContent>
              </Select>
              {import.meta.env.PROD && (
                <p className="text-xs text-muted-foreground">Zebra printer locked in production</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handlePrint}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Printer className="mr-2 h-4 w-4" />
              Print Label
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UserSelectionDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSelectUser={handleUserSelect}
      />
    </>
  );
}
