import { useState, useEffect } from "react";
import { Loader2, Check, Printer, Package, Plus, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationLevel,
  getProductIcon,
} from "@/constants/quickPrintIcons";
import { QuickAddToQueueDialog } from "./QuickAddToQueueDialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getExpiryStatus, getStatusColor, getStatusLabel, shouldShowStatusBadge } from "@/utils/trafficLight";
import type { Allergen } from "@/hooks/useAllergens";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
  subcategory_count?: number;
  product_count?: number;
}

interface Subcategory {
  id: string;
  name: string;
  icon?: string | null;
  product_count?: number;
}

interface Product {
  id: string;
  name: string;
  category_id?: string;
  subcategory_id?: string;
  measuring_units?: {
    name: string;
    abbreviation: string;
  };
  label_categories?: {
    id: string;
    name: string;
  };
  allergens?: Allergen[];
  latestLabel?: {
    id: string;
    expiry_date: string;
    condition: string;
  } | null;
}

interface QuickPrintCategoryViewProps {
  navigationStack: NavigationLevel[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  loadingSubcategories: boolean;
  loadingProducts: boolean;
  printingProductId: string | null;
  successProductId: string | null;
  onCategorySelect: (category: Category) => void;
  onSubcategorySelect: (subcategory: Subcategory) => void;
  onProductSelect: (product: Product) => void;
  className?: string;
}

export function QuickPrintCategoryView({
  navigationStack,
  categories,
  subcategories,
  products,
  loadingSubcategories,
  loadingProducts,
  printingProductId,
  successProductId,
  onCategorySelect,
  onSubcategorySelect,
  onProductSelect,
  className,
}: QuickPrintCategoryViewProps) {
  const { user } = useAuth();
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent triggering onProductSelect
    setQuickAddProduct(product);
    setQuickAddDialogOpen(true);
  };
  // Determine current view level
  const currentLevel = navigationStack.length === 0 
    ? 'categories' 
    : navigationStack[navigationStack.length - 1].type === 'category'
    ? 'subcategories'
    : 'products';

  // Render Categories View
  if (currentLevel === 'categories') {
    if (categories.length === 0) {
      return (
        <div className={cn("text-center py-12", className)}>
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            No label categories are available for your organization. Please contact your administrator or create categories in Settings.
          </p>
          <div className="text-xs text-muted-foreground/60">
            Check browser console for details (F12)
          </div>
        </div>
      );
    }
    
    return (
      <div className={cn("space-y-4", className)}>
        <p className="text-sm text-muted-foreground">
          Select a category to view products
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              className="h-36 sm:h-40 flex flex-col items-center justify-center p-4 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group active:scale-95 touch-manipulation shadow-sm hover:shadow-md"
              onClick={() => onCategorySelect(category)}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                {category.icon || '📁'}
              </div>
              <span className="text-sm font-medium text-center line-clamp-2 leading-tight">
                {category.name}
              </span>
              {category.product_count !== undefined && (
                <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 mt-2">
                  {category.product_count} {category.product_count === 1 ? 'product' : 'products'}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Render Subcategories View
  if (currentLevel === 'subcategories') {
    if (loadingSubcategories) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading subcategories...</span>
        </div>
      );
    }

    // If no subcategories and products are loaded, switch to products view
    if (subcategories.length === 0 && !loadingProducts && products.length > 0) {
      // Fall through to products view below
    } else if (subcategories.length === 0) {
      // No subcategories and no products yet - show loading or empty state
      if (loadingProducts) {
        return (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading products...</span>
          </div>
        );
      }
      // No subcategories, no products - show empty state
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No subcategories or products found in this category</p>
        </div>
      );
    }

    return (
      <div className={cn("space-y-4", className)}>
        <p className="text-sm text-muted-foreground">
          Select a subcategory to view products
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {subcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant="outline"
              className="min-h-[10rem] sm:min-h-[11rem] flex flex-col items-center justify-center p-3 sm:p-4 gap-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group active:scale-95 touch-manipulation shadow-sm hover:shadow-md"
              onClick={() => onSubcategorySelect(subcategory)}
            >
              <div className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform leading-none">
                {subcategory.icon || '📂'}
              </div>
              <span className="text-sm sm:text-base font-medium text-center line-clamp-2 leading-tight px-2">
                {subcategory.name}
              </span>
              {subcategory.product_count !== undefined && (
                <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 mt-1">
                  {subcategory.product_count} {subcategory.product_count === 1 ? 'product' : 'products'}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Render Products View
  if (currentLevel === 'products') {
    if (loadingProducts) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading products...</span>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found in this {navigationStack[navigationStack.length - 1]?.type || 'category'}</p>
        </div>
      );
    }

    return (
      <div className={cn("space-y-4", className)}>
        <p className="text-sm text-muted-foreground">
          Tap to print instantly • Long-press + icon to add to queue
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {products.map((product) => {
            const isLoading = printingProductId === product.id;
            const isSuccess = successProductId === product.id;
            
            // Get expiry status from latest printed label
            const expiryStatus = product.latestLabel ? getExpiryStatus(product.latestLabel.expiry_date) : null;
            const statusColor = expiryStatus ? getStatusColor(expiryStatus) : null;
            const showExpiryWarning = expiryStatus === 'warning' || expiryStatus === 'expired';
            
            // Allergen warnings
            const hasCriticalAllergens = product.allergens?.some(a => a.severity === 'critical');
            const criticalCount = product.allergens?.filter(a => a.severity === 'critical').length || 0;

            return (
              <div key={product.id} className="relative">
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className={cn(
                    "w-full min-h-[10rem] sm:min-h-[11rem] flex flex-col items-center justify-between p-3 sm:p-4 gap-2 transition-all duration-200 group active:scale-95 touch-manipulation shadow-sm hover:shadow-md relative",
                    isSuccess
                      ? "bg-green-500 text-white border-green-600 hover:bg-green-600"
                      : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  )}
                  onClick={() => onProductSelect(product)}
                >
                  {/* Top Row - Badges with proper spacing */}
                  <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-20 pointer-events-none gap-2">
                    {/* Expiry Badge (Top-Left) - Only show for warnings and expired */}
                    {product.latestLabel && expiryStatus && shouldShowStatusBadge(expiryStatus) ? (
                      <Badge 
                        variant="secondary"
                        className="h-5 sm:h-6 px-2 text-[10px] sm:text-xs font-bold shadow-sm pointer-events-auto shrink-0"
                        style={{ 
                          backgroundColor: statusColor ? `${statusColor}20` : 'rgba(0,0,0,0.1)', 
                          color: statusColor || '#000',
                          borderColor: statusColor || 'transparent'
                        }}
                      >
                        {getStatusLabel(expiryStatus)}
                      </Badge>
                    ) : (
                      <span className="shrink-0"></span>
                    )}
                    
                    {/* Quick Add Button (Top-Right) */}
                    {!isLoading && !isSuccess && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform bg-primary text-primary-foreground hover:bg-primary/90 pointer-events-auto shrink-0"
                        onClick={(e) => handleQuickAdd(e, product)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Center Content - Well spaced */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 mt-8 mb-6">
                    {isLoading ? (
                      <div className={cn(
                        "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-colors",
                        "bg-primary/10 group-hover:bg-primary-foreground/20"
                      )}>
                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
                      </div>
                    ) : isSuccess ? (
                      <div className={cn(
                        "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-colors",
                        "bg-green-600"
                      )}>
                        <Check className="w-8 h-8 sm:w-10 sm:h-10 animate-in zoom-in duration-300" />
                      </div>
                    ) : (
                      <div className="text-5xl sm:text-6xl leading-none">
                        {getProductIcon()}
                      </div>
                    )}
                    
                    <span className="text-sm sm:text-base font-medium text-center line-clamp-2 px-2 w-full">
                      {isLoading ? "Printing..." : isSuccess ? "Sent!" : product.name}
                    </span>
                  </div>
                  
                  {/* Bottom Info - Unit Display */}
                  <div className="w-full flex flex-col items-center gap-1 min-h-[1.5rem]">
                    {/* Unit display */}
                    {!isLoading && !isSuccess && product.measuring_units && (
                      <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">
                        {product.measuring_units.abbreviation}
                      </span>
                    )}
                  </div>
                </Button>
                
                {/* Allergen Count Badge (Bottom-Right) - Outside button */}
                {product.allergens && product.allergens.length > 0 && (
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "absolute bottom-2 right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-sm z-10",
                      hasCriticalAllergens 
                        ? "bg-red-500 text-white border-red-600" 
                        : "bg-yellow-500 text-white border-yellow-600"
                    )}
                  >
                    {product.allergens.length}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Add Dialog */}
        <QuickAddToQueueDialog
          product={quickAddProduct}
          open={quickAddDialogOpen}
          onOpenChange={setQuickAddDialogOpen}
        />
      </div>
    );
  }

  return null;
}
