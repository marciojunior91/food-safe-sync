import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Printer, 
  Grid3x3, 
  List, 
  Search,
  Package,
  Check,
  Loader2,
  Zap,
  AlertTriangle,
  Plus,
  Clock,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintMode, NavigationLevel } from "@/constants/quickPrintIcons";
import { QuickPrintModeToggle } from "./QuickPrintModeToggle";
import { QuickPrintBreadcrumb } from "./QuickPrintBreadcrumb";
import { QuickPrintCategoryView } from "./QuickPrintCategoryView";
import { QuickAddToQueueDialog } from "./QuickAddToQueueDialog";
import { supabase } from "@/integrations/supabase/client";
import { AllergenBadge } from "./AllergenBadge";
import { useAuth } from "@/hooks/useAuth";
import { usePrinter } from "@/hooks/usePrinter";
import { getExpiryStatus, getStatusColor, getStatusLabel, shouldShowStatusBadge } from "@/utils/trafficLight";
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
  latestLabel?: {
    id: string;
    expiry_date: string;
    condition: string;
  } | null;
}

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
  category_id: string;
  product_count?: number;
}

interface QuickPrintGridProps {
  products: Product[];
  onQuickPrint: (product: Product) => void;
  className?: string;
}

export function QuickPrintGrid({ products, onQuickPrint, className }: QuickPrintGridProps) {
  const { user } = useAuth();
  const { settings, availablePrinters, changePrinter } = usePrinter();
  
  // View mode state
  const [printMode, setPrintMode] = useState<PrintMode>('categories');
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
  
  // Quick add to queue dialog state
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);

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
      // Get user's organization_id
      if (!user?.id) {
        console.error('❌ QuickPrintGrid: No user ID available');
        setCategories([]);
        return;
      }
      
      console.log('🔍 QuickPrintGrid: Fetching profile for user:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ QuickPrintGrid: Error fetching profile:', profileError);
        setCategories([]);
        return;
      }
      
      if (!profile?.organization_id) {
        console.warn('⚠️ QuickPrintGrid: User has no organization_id. Profile:', profile);
        setCategories([]);
        return;
      }

      console.log('✅ QuickPrintGrid: Organization ID:', profile.organization_id);

      // First, get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("label_categories")
        .select("id, name, icon")
        .eq('organization_id', profile.organization_id)
        .order("name");

      if (categoriesError) {
        console.error('❌ QuickPrintGrid: Error fetching categories:', categoriesError);
        throw categoriesError;
      }
      
      console.log(`✅ QuickPrintGrid: Found ${categoriesData?.length || 0} categories`);

      // Then, get counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (cat) => {
          // Count subcategories
          const { count: subCount } = await supabase
            .from("label_subcategories")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq('organization_id', profile.organization_id);

          // Count products in this category
          const { count: prodCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq('organization_id', profile.organization_id);

          return {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            subcategory_count: subCount || 0,
            product_count: prodCount || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    setLoadingSubcategories(true);
    try {
      // Get user's organization_id
      if (!user?.id) {
        setSubcategories([]);
        return [];
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.organization_id) {
        setSubcategories([]);
        return [];
      }

      // Get subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from("label_subcategories")
        .select("id, name, icon, category_id")
        .eq("category_id", categoryId)
        .eq('organization_id', profile.organization_id)
        .order("display_order");

      if (subcategoriesError) throw subcategoriesError;

      // Get product counts for each subcategory
      const subcategoriesWithCounts = await Promise.all(
        (subcategoriesData || []).map(async (sub) => {
          // For "Recipes" subcategory, count from recipes table
          let prodCount = 0;
          if (sub.name === 'Recipes') {
            const { count } = await supabase
              .from("recipes")
              .select("*", { count: "exact", head: true })
              .eq('organization_id', profile.organization_id);
            prodCount = count || 0;
          } else {
            // For other subcategories, count from products table
            const { count } = await supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("subcategory_id", sub.id)
              .eq('organization_id', profile.organization_id);
            prodCount = count || 0;
          }

          return {
            id: sub.id,
            name: sub.name,
            icon: sub.icon,
            category_id: sub.category_id,
            product_count: prodCount,
          };
        })
      );

      setSubcategories(subcategoriesWithCounts);
      return subcategoriesWithCounts;
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
      // Get user's organization_id
      if (!user?.id) {
        setFilteredProducts([]);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.organization_id) {
        setFilteredProducts([]);
        return;
      }

      // Check if this is the "Recipes" subcategory
      let isRecipesSubcategory = false;
      if (subcategoryId) {
        const { data: subcategory } = await supabase
          .from('label_subcategories')
          .select('name')
          .eq('id', subcategoryId)
          .single();
        
        isRecipesSubcategory = subcategory?.name === 'Recipes';
      }

      // If Recipes subcategory, fetch from recipes table
      if (isRecipesSubcategory) {
        const { data: recipes, error: recipesError } = await supabase
          .from('recipes')
          .select('id, name, hold_time_days, allergens')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (recipesError) throw recipesError;

        // Transform recipes to look like products
        const recipesAsProducts = (recipes || []).map(recipe => ({
          id: recipe.id,
          name: recipe.name,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          measuring_unit_id: null,
          measuring_units: null,
          label_categories: null,
          allergens: [], // Recipe allergens stored as array in recipes table
          latestLabel: null, // Recipes don't have pre-printed labels
          shelf_life_days: recipe.hold_time_days // Map hold_time_days to shelf_life_days for consistency
        }));

        setFilteredProducts(recipesAsProducts);
        setLoadingProducts(false);
        return;
      }

      // Regular products query
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
        .eq("category_id", categoryId)
        .eq('organization_id', profile.organization_id);

      if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
      } else {
        query = query.is("subcategory_id", null);
      }

      query = query.order("name");

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform product_allergens into allergens array
      const productsWithAllergens = (data || []).map(product => ({
        ...product,
        allergens: product.product_allergens
          ?.map((pa: any) => pa.allergens)
          .filter(Boolean) || []
      }));
      
      // Fetch latest printed label for each product
      const productsWithLabels = await Promise.all(
        productsWithAllergens.map(async (product) => {
          const { data: latestLabel } = await supabase
            .from('printed_labels')
            .select('id, expiry_date, condition')
            .eq('product_id', product.id)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          return {
            ...product,
            latestLabel
          };
        })
      );
      
      setFilteredProducts(productsWithLabels);
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
      icon: category.icon || '📁', // Use database icon or fallback
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
      icon: subcategory.icon || '📂', // Use database icon or fallback
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

  // Handler for quick add to queue
  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setQuickAddProduct(product);
    setQuickAddDialogOpen(true);
  };

  return (
    <>
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        {/* Printer Selector */}
        <div className="mb-4 p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Settings className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <Label className="text-xs font-medium">Printer Output</Label>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {filteredProducts.map((product) => {
                      const isLoading = printingProductId === product.id;
                      const isSuccess = successProductId === product.id;
                      const hasCriticalAllergens = product.allergens?.some(a => a.severity === 'critical');
                      const criticalCount = product.allergens?.filter(a => a.severity === 'critical').length || 0;
                      
                      // Get expiry status from latest printed label
                      const expiryStatus = product.latestLabel ? getExpiryStatus(product.latestLabel.expiry_date) : null;
                      const statusColor = expiryStatus ? getStatusColor(expiryStatus) : null;
                      const showExpiryWarning = expiryStatus === 'warning' || expiryStatus === 'expired';
                      
                      return (
                        <div key={product.id} className="relative">
                          <Button
                            variant="outline"
                            disabled={isLoading}
                            className={cn(
                              "min-h-[10rem] sm:min-h-[11rem] w-full flex flex-col items-center justify-between p-3 sm:p-4 gap-2 transition-all duration-200 group active:scale-95 touch-manipulation shadow-sm hover:shadow-md relative",
                              isSuccess 
                                ? "bg-green-500 text-white border-green-600 hover:bg-green-600" 
                                : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                            )}
                            onClick={() => handleQuickPrint(product)}
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
                                <div
                                  role="button"
                                  tabIndex={0}
                                  className="h-8 w-8 rounded-full shadow-md hover:scale-110 bg-primary text-primary-foreground hover:bg-primary/90 pointer-events-auto transition-transform shrink-0 flex items-center justify-center cursor-pointer"
                                  onClick={(e) => handleQuickAdd(e, product)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      handleQuickAdd(e as any, product);
                                    }
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                </div>
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
                                  <Check className="w-8 h-8 sm:w-10 sm:h-10" />
                                </div>
                              ) : (
                                <div className="text-5xl sm:text-6xl leading-none">
                                  📦
                                </div>
                              )}
                              
                              <span className="text-sm sm:text-base font-medium text-center line-clamp-2 px-2 w-full">
                                {product.name}
                              </span>
                            </div>
                            
                            {/* Bottom Info - Empty space for consistency */}
                            <div className="w-full flex flex-col items-center gap-1 min-h-[1.5rem]">
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
                )}

                {/* List View - TOUCH-FRIENDLY with larger rows */}
                {viewMode === "list" && (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => {
                      const isLoading = printingProductId === product.id;
                      const isSuccess = successProductId === product.id;
                      const hasCriticalAllergens = product.allergens?.some(a => a.severity === 'critical');
                      
                      // Get expiry status from latest printed label
                      const expiryStatus = product.latestLabel ? getExpiryStatus(product.latestLabel.expiry_date) : null;
                      const statusColor = expiryStatus ? getStatusColor(expiryStatus) : null;
                      const showExpiryWarning = expiryStatus === 'warning' || expiryStatus === 'expired';
                      
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
                            {isLoading ? (
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0",
                                "bg-primary/10 group-hover:bg-primary-foreground/20"
                              )}>
                                <Loader2 className="w-6 h-6 animate-spin" />
                              </div>
                            ) : isSuccess ? (
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0",
                                "bg-green-600"
                              )}>
                                <Check className="w-6 h-6" />
                              </div>
                            ) : (
                              <div className="text-3xl shrink-0">
                                📦
                              </div>
                            )}
                            
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-medium">
                                  {product.name}
                                </span>
                                
                                {/* Expiry Status Badge - Only show for warnings and expired */}
                                {!isLoading && !isSuccess && product.latestLabel && expiryStatus && shouldShowStatusBadge(expiryStatus) && (
                                  <Badge 
                                    variant="secondary"
                                    className="h-5 px-2 text-xs font-bold"
                                    style={{ 
                                      backgroundColor: statusColor ? `${statusColor}20` : 'rgba(0,0,0,0.1)', 
                                      color: statusColor || '#000',
                                      borderColor: statusColor || 'transparent'
                                    }}
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {expiryStatus && getStatusLabel(expiryStatus)}
                                  </Badge>
                                )}
                                
                                {/* Allergen Badge - Show if has allergens */}
                                {!isLoading && !isSuccess && product.allergens && product.allergens.length > 0 && (
                                  <Badge 
                                    variant="secondary"
                                    className={cn(
                                      "h-5 px-2 text-xs font-bold",
                                      hasCriticalAllergens 
                                        ? "bg-red-500 text-white border-red-600" 
                                        : "bg-yellow-500 text-white border-yellow-600"
                                    )}
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {product.allergens.length} Allergen{product.allergens.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
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
    
    {/* Quick Add to Queue Dialog */}
    <QuickAddToQueueDialog
      product={quickAddProduct}
      open={quickAddDialogOpen}
      onOpenChange={setQuickAddDialogOpen}
    />
    </>
  );
}
