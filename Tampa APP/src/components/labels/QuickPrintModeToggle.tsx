import { Package, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintMode } from "@/constants/quickPrintIcons";
import { cn } from "@/lib/utils";

interface QuickPrintModeToggleProps {
  mode: PrintMode;
  onModeChange: (mode: PrintMode) => void;
  className?: string;
}

export function QuickPrintModeToggle({ 
  mode, 
  onModeChange, 
  className 
}: QuickPrintModeToggleProps) {
  return (
    <div className={cn("flex gap-2 p-1 bg-muted rounded-lg", className)}>
      <Button
        variant={mode === 'products' ? 'default' : 'ghost'}
        className={cn(
          "flex-1 transition-all",
          mode === 'products' && "shadow-sm"
        )}
        onClick={() => onModeChange('products')}
      >
        <Package className="w-4 h-4 mr-2" />
        By Products
      </Button>
      <Button
        variant={mode === 'categories' ? 'default' : 'ghost'}
        className={cn(
          "flex-1 transition-all",
          mode === 'categories' && "shadow-sm"
        )}
        onClick={() => onModeChange('categories')}
      >
        <FolderTree className="w-4 h-4 mr-2" />
        By Categories
      </Button>
    </div>
  );
}
