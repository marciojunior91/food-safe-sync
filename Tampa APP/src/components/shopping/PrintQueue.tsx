// PrintQueue - Shopping cart style print queue panel
import { useState } from 'react';
import { X, Trash2, Plus, Minus, Printer, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePrintQueue } from '@/hooks/usePrintQueue';
import { usePrinter } from '@/hooks/usePrinter';
import { cn } from '@/lib/utils';

export function PrintQueue() {
  const {
    items,
    totalLabels,
    totalItems,
    isOpen,
    isPrinting,
    printProgress,
    removeFromQueue,
    updateQuantity,
    clearQueue,
    closeQueue,
    printAll
  } = usePrintQueue();

  const { settings, availablePrinters, changePrinter } = usePrinter();

  const [showClearDialog, setShowClearDialog] = useState(false);

  // Calculate estimated print time (3 seconds per label)
  const estimatedMinutes = Math.ceil((totalLabels * 3) / 60);

  // Format relative time
  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Handle quantity change
  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const newQuantity = item.quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
      updateQuantity(itemId, newQuantity);
    }
  };

  // Handle print all
  const handlePrintAll = async () => {
    await printAll();
  };

  // Handle clear confirmation
  const handleClearQueue = () => {
    clearQueue();
    setShowClearDialog(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeQueue}
      />

      {/* Panel */}
      <div 
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[450px] bg-background shadow-2xl z-50",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Printer className="w-6 h-6 text-primary" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-1.5 py-0.5 text-xs">
                  {totalItems}
                </Badge>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">Print Queue</h2>
              <p className="text-xs text-muted-foreground">
                {totalItems} item{totalItems !== 1 ? 's' : ''} • {totalLabels} label{totalLabels !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeQueue}
            disabled={isPrinting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Printer Selector */}
        <div className="px-4 py-3 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Settings className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <Label className="text-xs font-medium">Printer</Label>
                <p className="text-xs text-muted-foreground truncate">
                  {settings?.name || 'No printer'} • {settings?.paperWidth}×{settings?.paperHeight}mm
                </p>
              </div>
            </div>
            <Select value={settings?.type || 'generic'} onValueChange={changePrinter}>
              <SelectTrigger className="w-[160px] h-8 text-xs flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePrinters.map(p => (
                  <SelectItem key={p.type} value={p.type}>
                    <div className="flex items-center gap-2">
                      <Printer className="h-3 w-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium">{p.name}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Printer className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Add labels to your print queue from the label form or quick print view.
            </p>
          </div>
        ) : (
          <>
            {/* Items List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      {/* Product info with index number */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight mb-1">
                            {item.productName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {item.categoryName}
                          </p>
                        </div>
                      </div>

                      {/* Dates info */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Prep:</span>
                          <span className="ml-1 font-medium">
                            {new Date(item.labelData.prepDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expiry:</span>
                          <span className="ml-1 font-medium">
                            {new Date(item.labelData.expiryDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Quantity:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={isPrinting || item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <div className="w-12 text-center font-semibold">
                              {item.quantity}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              disabled={isPrinting || item.quantity >= 100}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromQueue(item.id)}
                          disabled={isPrinting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Added time */}
                      <div className="text-xs text-muted-foreground">
                        Added {formatTimeAgo(item.addedAt)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Print Progress */}
            {isPrinting && printProgress && (
              <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Printing...</span>
                    <span className="text-muted-foreground">
                      {printProgress.printedLabels} / {printProgress.totalLabels} labels
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ 
                        width: `${(printProgress.printedLabels / printProgress.totalLabels) * 100}%` 
                      }}
                    />
                  </div>

                  {/* Current item */}
                  {printProgress.currentItem && (
                    <div className="text-xs text-muted-foreground">
                      Printing: {printProgress.currentItem} ({printProgress.currentQuantity} copies)
                    </div>
                  )}

                  {/* Errors */}
                  {printProgress.errors.length > 0 && (
                    <div className="flex items-start gap-2 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{printProgress.errors.length} error{printProgress.errors.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t bg-muted/20 space-y-3">
              {/* Summary */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Labels:</span>
                  <span className="font-bold text-lg">{totalLabels}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Estimated time:</span>
                  <span>~{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowClearDialog(true)}
                  disabled={isPrinting}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  variant="hero"
                  onClick={handlePrintAll}
                  disabled={isPrinting}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print All ({totalLabels})
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clear confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Print Queue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {totalItems} item{totalItems !== 1 ? 's' : ''} ({totalLabels} labels) from your print queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearQueue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear Queue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
