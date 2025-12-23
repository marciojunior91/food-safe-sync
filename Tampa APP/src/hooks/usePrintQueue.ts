// usePrintQueue - React hook for managing print queue (shopping cart for labels)
import { useState, useCallback } from 'react';
import { LabelData } from '@/components/labels/LabelForm';
import { usePrinter } from './usePrinter';
import { useToast } from './use-toast';
import { usePrintQueueContext } from '@/contexts/PrintQueueContext';
import { saveLabelToDatabase } from '@/utils/zebraPrinter';

const MAX_QUEUE_SIZE = 50;

export interface PrintQueueItem {
  id: string;                    // Unique queue item ID
  labelData: LabelData;          // Complete label data
  quantity: number;              // Number of copies to print
  addedAt: string;               // ISO timestamp
  productName: string;           // For quick display
  categoryName: string;          // For quick display
}

export interface PrintProgress {
  current: number;               // Current item being printed (1-indexed)
  total: number;                 // Total items to print
  totalLabels: number;           // Total individual labels
  currentItem: string;           // Current product name
  currentQuantity: number;       // Quantity of current item
  printedLabels: number;         // Labels printed so far
  errors: PrintError[];          // Failed items
}

export interface PrintError {
  itemId: string;
  productName: string;
  error: string;
}

interface PrintResult {
  success: boolean;
  totalPrinted: number;
  totalFailed: number;
  errors: PrintError[];
}

export function usePrintQueue() {
  const { toast } = useToast();
  const { printBatch, isLoading: isPrinterBusy } = usePrinter();
  const { isOpen, items, setItems, openQueue, closeQueue, toggleQueue } = usePrintQueueContext();
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState<PrintProgress | null>(null);

  // Calculate total labels
  const totalLabels = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = items.length;

  // Generate unique ID for queue items
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add item to queue (or update quantity if duplicate)
  const addToQueue = useCallback((labelData: LabelData, quantity: number = 1) => {
    console.log('usePrintQueue: addToQueue called with:', labelData.productName, 'quantity:', quantity, 'current items:', items.length);
    
    if (quantity < 1) {
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity must be at least 1.',
        variant: 'destructive'
      });
      return;
    }

    // Check for duplicate (same product + same dates)
    const existingItemIndex = items.findIndex(item => 
      item.labelData.productId === labelData.productId &&
      item.labelData.prepDate === labelData.prepDate &&
      item.labelData.expiryDate === labelData.expiryDate
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
      console.log('usePrintQueue: updated existing item, new total:', newItems.length);
      
      toast({
        title: 'Quantity Updated',
        description: `Added ${quantity} more labels for "${labelData.productName}". Total: ${newItems[existingItemIndex].quantity}`,
      });
      return;
    }

    // Check max queue size
    if (items.length >= MAX_QUEUE_SIZE) {
      toast({
        title: 'Queue Full',
        description: `Maximum queue size is ${MAX_QUEUE_SIZE} items. Please print or remove items first.`,
        variant: 'destructive'
      });
      return;
    }

    // Add new item
    const newItem: PrintQueueItem = {
      id: generateId(),
      labelData,
      quantity,
      addedAt: new Date().toISOString(),
      productName: labelData.productName,
      categoryName: labelData.categoryName
    };

    const newItems = [...items, newItem];
    console.log('usePrintQueue: adding new item, new total:', newItems.length, 'new item:', newItem);
    setItems(newItems);
    
    toast({
      title: 'Added to Queue',
      description: `${quantity} label${quantity > 1 ? 's' : ''} for "${labelData.productName}" added to print queue.`,
    });

    // Auto-open queue if it was closed
    if (!isOpen) {
      console.log('usePrintQueue: queue was closed, opening in 300ms');
      setTimeout(() => openQueue(), 300);
    }
  }, [items, isOpen, openQueue, toast, setItems]);

  // Remove item from queue
  const removeFromQueue = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setItems(items.filter(i => i.id !== itemId));
    
    toast({
      title: 'Removed from Queue',
      description: `"${item.productName}" removed from print queue.`,
    });
  }, [items, toast]);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity must be at least 1.',
        variant: 'destructive'
      });
      return;
    }

    if (newQuantity > 100) {
      toast({
        title: 'Quantity Too Large',
        description: 'Maximum quantity per item is 100.',
        variant: 'destructive'
      });
      return;
    }

    const newItems = items.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setItems(newItems);
  }, [items, toast]);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    const count = items.length;
    setItems([]);
    
    toast({
      title: 'Queue Cleared',
      description: `Removed ${count} item${count > 1 ? 's' : ''} from print queue.`,
    });
  }, [items, toast]);

  // Print all items in queue
  const printAll = useCallback(async (): Promise<PrintResult> => {
    if (items.length === 0) {
      toast({
        title: 'Empty Queue',
        description: 'No items in print queue.',
        variant: 'destructive'
      });
      return { success: false, totalPrinted: 0, totalFailed: 0, errors: [] };
    }

    if (isPrinterBusy) {
      toast({
        title: 'Printer Busy',
        description: 'Please wait for current print job to finish.',
        variant: 'destructive'
      });
      return { success: false, totalPrinted: 0, totalFailed: 0, errors: [] };
    }

    setIsPrinting(true);
    const errors: PrintError[] = [];
    let printedLabels = 0;
    const totalLabelsCount = totalLabels;

    // Initialize progress
    setPrintProgress({
      current: 0,
      total: items.length,
      totalLabels: totalLabelsCount,
      currentItem: '',
      currentQuantity: 0,
      printedLabels: 0,
      errors: []
    });

    try {
      // Process each item sequentially
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Update progress
        setPrintProgress({
          current: i + 1,
          total: items.length,
          totalLabels: totalLabelsCount,
          currentItem: item.productName,
          currentQuantity: item.quantity,
          printedLabels,
          errors
        });

        try {
          // Save to database first (for each quantity)
          for (let j = 0; j < item.quantity; j++) {
            await saveLabelToDatabase({
              productId: item.labelData.productId || "",
              productName: item.labelData.productName,
              categoryId: (item.labelData.categoryId && item.labelData.categoryId !== "all" && item.labelData.categoryId !== "") 
                ? item.labelData.categoryId 
                : null,
              categoryName: item.labelData.categoryName,
              preparedBy: item.labelData.preparedBy || "",
              preparedByName: item.labelData.preparedByName,
              prepDate: item.labelData.prepDate,
              expiryDate: item.labelData.expiryDate,
              condition: item.labelData.condition,
              quantity: "1", // Each record is for 1 label
              unit: item.labelData.unit,
              batchNumber: item.labelData.batchNumber || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            });
          }
          
          // Transform LabelData to printer format
          const printerData = {
            productName: item.labelData.productName,
            categoryName: item.labelData.categoryName,
            subcategoryName: item.labelData.subcategoryName,
            preparedDate: item.labelData.prepDate,
            useByDate: item.labelData.expiryDate,
            allergens: [], // Allergens will be fetched if needed
            storageInstructions: `Condition: ${item.labelData.condition}`,
            barcode: item.labelData.batchNumber,
          };
          
          // Create array of label data (one per quantity)
          const labelsForItem = Array(item.quantity).fill(printerData);
          
          // Print this batch
          const success = await printBatch(labelsForItem);
          
          if (success) {
            printedLabels += item.quantity;
          } else {
            errors.push({
              itemId: item.id,
              productName: item.productName,
              error: 'Print failed'
            });
          }
        } catch (error) {
          console.error(`Error printing ${item.productName}:`, error);
          errors.push({
            itemId: item.id,
            productName: item.productName,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Small delay between items
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const totalFailed = totalLabelsCount - printedLabels;
      const allSuccessful = errors.length === 0;

      // Clear queue if all successful
      if (allSuccessful) {
        setItems([]);
        toast({
          title: 'Print Complete',
          description: `Successfully printed ${printedLabels} labels!`,
        });
      } else {
        // Keep failed items in queue, remove successful ones
        const failedItemIds = errors.map(e => e.itemId);
        setItems(items.filter(item => failedItemIds.includes(item.id)));
        
        toast({
          title: 'Print Completed with Errors',
          description: `Printed ${printedLabels} labels. ${errors.length} item${errors.length > 1 ? 's' : ''} failed.`,
          variant: 'destructive'
        });
      }

      return {
        success: allSuccessful,
        totalPrinted: printedLabels,
        totalFailed,
        errors
      };

    } catch (error) {
      console.error('Batch print error:', error);
      toast({
        title: 'Print Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      
      return {
        success: false,
        totalPrinted: printedLabels,
        totalFailed: totalLabelsCount - printedLabels,
        errors
      };
    } finally {
      setIsPrinting(false);
      setPrintProgress(null);
    }
  }, [items, totalLabels, isPrinterBusy, printBatch, toast]);

  // Retry failed items
  const retryFailed = useCallback(async (errorIds: string[]): Promise<PrintResult> => {
    const itemsToRetry = items.filter(item => errorIds.includes(item.id));
    
    if (itemsToRetry.length === 0) {
      toast({
        title: 'No Items to Retry',
        description: 'No failed items found in queue.',
        variant: 'destructive'
      });
      return { success: false, totalPrinted: 0, totalFailed: 0, errors: [] };
    }

    // Temporarily set items to retry-only, then restore original
    const originalItems = [...items];
    setItems(itemsToRetry);
    
    const result = await printAll();
    
    // If still failed, restore original items
    if (!result.success) {
      setItems(originalItems);
    }
    
    return result;
  }, [items, printAll, toast]);

  return {
    // State
    items,
    totalLabels,
    totalItems,
    isOpen,
    isPrinting,
    printProgress,
    
    // Actions
    addToQueue,
    removeFromQueue,
    updateQuantity,
    clearQueue,
    toggleQueue,
    openQueue,
    closeQueue,
    printAll,
    retryFailed
  };
}
