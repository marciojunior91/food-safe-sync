import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Printer, 
  Grid3x3, 
  List, 
  Search,
  Package,
  Check,
  Loader2,
  Zap,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintMode, NavigationLevel, getCategoryIcon, getSubcategoryIcon } from "@/constants/quickPrintIcons";
import { QuickPrintModeToggle } from "./QuickPrintModeToggle";
import { QuickPrintBreadcrumb } from "./QuickPrintBreadcrumb";
import { QuickPrintCategoryView } from "./QuickPrintCategoryView";
import { supabase } from "@/integrations/supabase/client";
import { AllergenBadge } from "./AllergenBadge";
import type { Allergen } from "@/hooks/useAllergens";

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
}

interface Category {
  id: string;
  name: string;
  subcategory_count?: number;
  product_count?: number;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  product_count?: number;
}

interface QuickPrintGridProps {
  products: Product[];
  onQuickPrint: (product: Product) => void;
  className?: string;
}

export function QuickPrintGrid({ products, onQuickPrint, className }: QuickPrintGridProps) {
  // View mode state
  const [printMode, setPrintMode] = useState<PrintMode>('products');
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Navigation state for category mode
  const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  
  // Loading states
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Print states
  const [printingProductId, setPrintingProductId] = useState<string | null>(null);
  const [successProductId, setSuccessProductId] = useState<string | null>(null);

  // Fetch categories with counts
  useEffect(() => {
    if (printMode === 'categories' && categories.length === 0) {
      fetchCategories();
    }
  }, [printMode]);

  // Filter products in "products" mode
  useEffect(() => {
    if (printMode === 'products') {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchTerm, printMode]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from("label_categories")
        .select(`
          id,
          name,
          label_subcategories(count),
          products(count)
        `)
        .order("name");

      if (error) throw error;

      const formattedCategories = (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        subcategory_count: cat.label_subcategories?.[0]?.count || 0,
        product_count: cat.products?.[0]?.count || 0,
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    setLoadingSubcategories(true);
    try {
      const { data, error } = await supabase
        .from("label_subcategories")
        .select(`
          id,
          name,
          category_id,
          products(count)
        `)
        .eq("category_id", categoryId)
        .order("display_order");

      if (error) throw error;

      const formattedSubcategories = (data || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        category_id: sub.category_id,
        product_count: sub.products?.[0]?.count || 0,
      }));

      setSubcategories(formattedSubcategories);
      return formattedSubcategories;
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      return [];
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const fetchProductsByCategory = async (categoryId: string, subcategoryId?: string) => {
    setLoadingProducts(true);
    try {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          category_id,
          subcategory_id,
          measuring_unit_id,
          measuring_units:measuring_unit_id (
            name,
            abbreviation
          ),
          label_categories:category_id (
            id,
            name
          ),
          product_allergens (
            allergen_id,
            allergens (
              id,
              name,
              icon,
              severity,
              is_common
            )
          )
        `)
        .eq("category_id", categoryId);

      if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
      } else {
        query = query.is("subcategory_id", null);
      }

      query = query.order("name");

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform product_allergens into allergens array
      const transformedProducts = (data || []).map(product => ({
        ...product,
        allergens: product.product_allergens
          ?.map((pa: any) => pa.allergens)
          .filter(Boolean) || []
      }));
      
      setFilteredProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setFilteredProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Navigation handlers
  const handleModeChange = (mode: PrintMode) => {
    setPrintMode(mode);
    setNavigationStack([]);
    setSubcategories([]);
    setSearchTerm("");
    if (mode === 'products') {
      setFilteredProducts(products);
    }
  };

  const handleCategorySelect = async (category: Category) => {
    const newLevel: NavigationLevel = {
      type: 'category',
      id: category.id,
      name: category.name,
      icon: getCategoryIcon(category.name),
    };
    setNavigationStack([newLevel]);

    // Fetch subcategories
    const subs = await fetchSubcategories(category.id);

    // If no subcategories, go directly to products
    if (subs.length === 0) {
      await fetchProductsByCategory(category.id);
    }
  };

  const handleSubcategorySelect = async (subcategory: Subcategory) => {
    const newLevel: NavigationLevel = {
      type: 'subcategory',
      id: subcategory.id,
      name: subcategory.name,
      icon: getSubcategoryIcon(subcategory.name),
    };
    setNavigationStack(prev => [...prev, newLevel]);

    // Fetch products for this subcategory
    const categoryId = navigationStack[0]?.id;
    if (categoryId) {
      await fetchProductsByCategory(categoryId, subcategory.id);
    }
  };

  const handleBack = () => {
    if (navigationStack.length === 0) return;

    const newStack = [...navigationStack];
    newStack.pop();
    setNavigationStack(newStack);

    if (newStack.length === 0) {
      // Back to categories
      setSubcategories([]);
      setFilteredProducts([]);
    } else if (newStack.length === 1) {
      // Back to subcategories (if any)
      const categoryId = newStack[0].id;
      if (categoryId) {
        fetchSubcategories(categoryId);
        setFilteredProducts([]);
      }
    }
  };

  const handleNavigateToLevel = (index: number) => {
    if (index >= navigationStack.length) return;

    const newStack = navigationStack.slice(0, index + 1);
    setNavigationStack(newStack);

    if (newStack.length === 1) {
      // Navigated back to category level
      const categoryId = newStack[0].id;
      if (categoryId) {
        fetchSubcategories(categoryId);
        setFilteredProducts([]);
      }
    }
  };

  const handleQuickPrint = async (product: Product) => {
    setPrintingProductId(product.id);
    
    try {
      await onQuickPrint(product);
      
      // Show success animation
      setPrintingProductId(null);
      setSuccessProductId(product.id);
      
      // Clear success state after 1.5 seconds
      setTimeout(() => {
        setSuccessProductId(null);
      }, 1500);
    } catch (error) {
      setPrintingProductId(null);
      // Error handling is done in parent component
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        {/* Mode Toggle */}
        <QuickPrintModeToggle 
          mode={printMode} 
          onModeChange={handleModeChange}
          className="mb-4"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Quick Print</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {printMode === 'categories' 
                ? navigationStack.length === 0 
                  ? `${categories.length} categories`
                  : navigationStack.length === 1 && subcategories.length > 0
                    ? `${subcategories.length} subcategories`
                    : `${filteredProducts.length} products`
                : `${filteredProducts.length} products`
              }
            </Badge>
          </div>
          
          {/* Grid/List toggle - only shown in products mode */}
          {printMode === 'products' && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 w-9 p-0"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-9 w-9 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Breadcrumb - only shown in categories mode when navigating */}
        {printMode === 'categories' && navigationStack.length > 0 && (
          <QuickPrintBreadcrumb
            navigationStack={navigationStack}
            onBack={handleBack}
            onNavigateToLevel={handleNavigateToLevel}
            className="mt-3"
          />
        )}
        
        {/* Search Bar - only in products mode */}
        {printMode === 'products' && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {printMode === 'categories' ? (
          /* Category Navigation Mode */
          loadingCategories && categories.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            </div>
          ) : (
            <QuickPrintCategoryView
              navigationStack={navigationStack}
              categories={categories}
              subcategories={subcategories}
              products={filteredProducts}
              loadingSubcategories={loadingSubcategories}
              loadingProducts={loadingProducts}
              printingProductId={printingProductId}
              successProductId={successProductId}
              onCategorySelect={handleCategorySelect}
              onSubcategorySelect={handleSubcategorySelect}
              onProductSelect={handleQuickPrint}
            />
          )
        ) : (
          /* Products Flat List Mode */
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <>
                {/* Grid View - TOUCH-FRIENDLY with larger buttons */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredProducts.map((product) => {
                      const isLoading = printingProductId === product.id;
                      const isSuccess = successProductId === product.id;
                      const hasCriticalAllergens = product.allergens?.some(a => a.severity === 'critical');
                      const criticalCount = product.allergens?.filter(a => a.severity === 'critical').length || 0;
                      
                      return (
                        <div key={product.id} className="relative">
                          <Button
                            variant="outline"
                            disabled={isLoading}
                            className={cn(
                              "h-36 sm:h-40 w-full flex flex-col items-center justify-center p-4 transition-all duration-200 group active:scale-95 touch-manipulation shadow-sm hover:shadow-md",
                              isSuccess 
                                ? "bg-green-500 text-white border-green-600 hover:bg-green-600" 
                                : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                            )}
                            onClick={() => handleQuickPrint(product)}
                          >
                            <div className={cn(
                              "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 transition-colors",
                              isSuccess 
                                ? "bg-green-600" 
                                : "bg-primary/10 group-hover:bg-primary-foreground/20"
                            )}>
                              {isLoading ? (
                                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
                              ) : isSuccess ? (
                                <Check className="w-7 h-7 sm:w-8 sm:h-8" />
                              ) : (
                                <Package className="w-7 h-7 sm:w-8 sm:h-8" />
                              )}
                            </div>
                            <span className="text-sm sm:text-base font-medium text-center line-clamp-2 px-1 mb-1">
                              {product.name}
                            </span>
                            
                            {/* Allergen Warning Indicator */}
                            {hasCriticalAllergens && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                <span className="text-xs text-red-600 font-semibold">
                                  {criticalCount} Critical
                                </span>
                              </div>
                            )}
                          </Button>
                          
                          {/* Allergen Count Badge (Top-Right Corner) */}
                          {product.allergens && product.allergens.length > 0 && (
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-md",
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
                )}

                {/* List View - TOUCH-FRIENDLY with larger rows */}
                {viewMode === "list" && (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => {
                      const isLoading = printingProductId === product.id;
                      const isSuccess = successProductId === product.id;
                      const criticalAllergens = product.allergens?.filter(a => a.severity === 'critical') || [];
                      
                      return (
                        <Button
                          key={product.id}
                          variant="outline"
                          disabled={isLoading}
                          className={cn(
                            "w-full min-h-20 flex items-center justify-between px-6 py-3 transition-all duration-200 group active:scale-[0.98] touch-manipulation shadow-sm hover:shadow-md",
                            isSuccess 
                              ? "bg-green-500 text-white border-green-600 hover:bg-green-600" 
                              : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                          )}
                          onClick={() => handleQuickPrint(product)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0",
                              isSuccess 
                                ? "bg-green-600" 
                                : "bg-primary/10 group-hover:bg-primary-foreground/20"
                            )}>
                              {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : isSuccess ? (
                                <Check className="w-6 h-6" />
                              ) : (
                                <Package className="w-6 h-6" />
                              )}
                            </div>
                            
                            <div className="flex-1 text-left">
                              <span className="text-base font-medium block mb-1">
                                {product.name}
                              </span>
                              
                              {/* Allergen Badges */}
                              {product.allergens && product.allergens.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {criticalAllergens.slice(0, 3).map(allergen => (
                                    <AllergenBadge 
                                      key={allergen.id}
                                      allergen={allergen}
                                      size="sm"
                                      showIcon={false}
                                    />
                                  ))}
                                  {product.allergens.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{product.allergens.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <Zap className="w-5 h-5 opacity-60 shrink-0" />
                        </Button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
