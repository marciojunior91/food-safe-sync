import { useState, useEffect } from "react";
import { Loader2, Check, Printer, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationLevel,
  getCategoryIcon,
  getSubcategoryIcon,
  getProductIcon,
} from "@/constants/quickPrintIcons";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  subcategory_count?: number;
  product_count?: number;
}

interface Subcategory {
  id: string;
  name: string;
  product_count?: number;
}

interface Product {
  id: string;
  name: string;
  measuring_units?: {
    name: string;
    abbreviation: string;
  };
  label_categories?: {
    name: string;
  };
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
  // Determine current view level
  const currentLevel = navigationStack.length === 0 
    ? 'categories' 
    : navigationStack[navigationStack.length - 1].type === 'category'
    ? 'subcategories'
    : 'products';

  // Render Categories View
  if (currentLevel === 'categories') {
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
                {getCategoryIcon(category.name)}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {subcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant="outline"
              className="h-36 sm:h-40 flex flex-col items-center justify-center p-4 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group active:scale-95 touch-manipulation shadow-sm hover:shadow-md"
              onClick={() => onSubcategorySelect(subcategory)}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                {getSubcategoryIcon(subcategory.name)}
              </div>
              <span className="text-sm font-medium text-center line-clamp-2 leading-tight">
                {subcategory.name}
              </span>
              {subcategory.product_count !== undefined && (
                <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 mt-2">
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
          Tap any product to print a label
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map((product) => {
            const isLoading = printingProductId === product.id;
            const isSuccess = successProductId === product.id;

            return (
              <Button
                key={product.id}
                variant="outline"
                disabled={isLoading}
                className={cn(
                  "h-36 sm:h-40 flex flex-col items-center justify-center p-4 transition-all duration-200 group active:scale-95 touch-manipulation shadow-sm hover:shadow-md",
                  isSuccess
                    ? "bg-green-500 text-white border-green-600 hover:bg-green-600"
                    : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                )}
                onClick={() => onProductSelect(product)}
              >
                <div
                  className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 transition-colors",
                    isSuccess
                      ? "bg-green-600"
                      : "bg-primary/10 group-hover:bg-primary-foreground/20"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
                  ) : isSuccess ? (
                    <Check className="w-7 h-7 sm:w-8 sm:h-8 animate-in zoom-in duration-300" />
                  ) : (
                    <span className="text-3xl">{getProductIcon()}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-center line-clamp-2 leading-tight px-1">
                  {isLoading ? "Printing..." : isSuccess ? "Sent!" : product.name}
                </span>
                {!isLoading && !isSuccess && product.measuring_units && (
                  <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 mt-2">
                    {product.measuring_units.abbreviation}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
