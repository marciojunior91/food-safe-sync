import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Printer, 
  Save, 
  X, 
  Package,
  Check,
  ChevronsUpDown,
  ArrowLeft,
  Plus
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LabelPreview } from "./LabelPreview";
import { AllergenSelectorEnhanced } from "./AllergenSelectorEnhanced";
import { DuplicateProductWarning } from "./DuplicateProductWarning";
import { useAllergens } from "@/hooks/useAllergens";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";

export interface LabelData {
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  productId: string;
  productName: string;
  condition: string;
  preparedBy: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  quantity: string;
  unit: string;
  batchNumber: string;
}

interface LabelFormProps {
  onSave?: (data: LabelData) => void;
  onPrint?: (data: LabelData) => void;
  onCancel?: () => void;
  selectedUser?: {
    id: string;
    user_id: string;
    display_name: string | null;
  };
  selectedTemplate?: {
    id: string;
    name: string;
    zpl_code?: string | null;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  category_id: string | null;
  subcategory_id?: string | null;
  measuring_unit_id: string | null;
  measuring_units?: {
    name: string;
    abbreviation: string;
  };
  label_categories?: {
    id: string;
    name: string;
  };
  label_subcategories?: {
    id: string;
    name: string;
  };
}

const CONDITIONS = [
  { value: "fresh", label: "Fresh", days: 1 },
  { value: "cooked", label: "Cooked", days: 3 },
  { value: "frozen", label: "Frozen", days: 30 },
  { value: "dry", label: "Dry Storage", days: 90 },
  { value: "refrigerated", label: "Refrigerated", days: 7 },
];

export function LabelForm({ onSave, onPrint, onCancel, selectedUser, selectedTemplate }: LabelFormProps) {
  const { toast } = useToast();
  const { updateProductAllergens } = useAllergens();
  const { user } = useAuth();
  
  // Organization ID fetched from user profile
  const [organizationId, setOrganizationId] = useState<string>("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Separate subcategory states for main form and dialog
  const [formSubcategories, setFormSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingFormSubcategories, setLoadingFormSubcategories] = useState(false);
  const [dialogSubcategories, setDialogSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingDialogSubcategories, setLoadingDialogSubcategories] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [openCategory, setOpenCategory] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openCondition, setOpenCondition] = useState(false);
  
  // Allergen state
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>([]);
  
  // New category creation states
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // New product creation states
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductSubcategory, setNewProductSubcategory] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Draft saving states
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  
  // Duplicate detection for new product creation (only active when organizationId is loaded)
  const {
    similarProducts,
    isLoading: isDuplicateCheckLoading,
    isDuplicate,
    error: duplicateCheckError,
    checkDuplicate
  } = useDuplicateDetection({
    productName: newProductName,
    organizationId: organizationId,
    minSimilarity: 0.3, // 30% similarity threshold for suggestions
    debounceMs: 500
  });

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];

  const [labelData, setLabelData] = useState<LabelData>({
    categoryId: "",
    categoryName: "",
    subcategoryId: "",
    subcategoryName: "",
    productId: "",
    productName: "",
    condition: "",
    preparedBy: selectedUser?.user_id || "",
    preparedByName: selectedUser?.display_name || "",
    prepDate: today,
    expiryDate: "",
    quantity: "",
    unit: "",
    batchNumber: ""
  });

  // Fetch organization_id from user profile
  useEffect(() => {
    const fetchOrganizationId = async () => {
      if (!user?.id) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (profile?.organization_id) {
          setOrganizationId(profile.organization_id);
        }
      } catch (error) {
        console.error("Error fetching organization_id:", error);
        toast({
          title: "Error",
          description: "Failed to load organization information",
          variant: "destructive"
        });
      }
    };
    
    fetchOrganizationId();
  }, [user, toast]);

  useEffect(() => {
    if (selectedUser) {
      setLabelData(prev => ({
        ...prev,
        preparedBy: selectedUser.user_id,
        preparedByName: selectedUser.display_name || ""
      }));
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories for MAIN FORM when category changes
  useEffect(() => {
    const fetchFormSubcategories = async () => {
      if (!labelData.categoryId || labelData.categoryId === "all") {
        setFormSubcategories([]);
        return;
      }

      try {
        setLoadingFormSubcategories(true);
        const { data, error } = await supabase
          .from("label_subcategories")
          .select("id, name")
          .eq("category_id", labelData.categoryId)
          .order("name");

        if (error) throw error;
        
        // Defensive: Ensure data is valid
        const validSubcategories = (data || []).filter(sub => 
          sub && typeof sub.id === 'string' && typeof sub.name === 'string'
        );
        
        setFormSubcategories(validSubcategories);
      } catch (error) {
        console.error("Error fetching form subcategories:", error);
        setFormSubcategories([]);
      } finally {
        setLoadingFormSubcategories(false);
      }
    };

    fetchFormSubcategories();
  }, [labelData.categoryId]);

  // Fetch subcategories for CREATE PRODUCT DIALOG when category changes
  useEffect(() => {
    const fetchDialogSubcategories = async () => {
      if (!newProductCategory) {
        setDialogSubcategories([]);
        return;
      }

      try {
        setLoadingDialogSubcategories(true);
        const { data, error } = await supabase
          .from("label_subcategories")
          .select("id, name")
          .eq("category_id", newProductCategory)
          .order("name");

        if (error) throw error;
        
        // Defensive: Ensure data is valid
        const validSubcategories = (data || []).filter(sub => 
          sub && typeof sub.id === 'string' && typeof sub.name === 'string'
        );
        
        setDialogSubcategories(validSubcategories);
      } catch (error) {
        console.error("Error fetching dialog subcategories:", error);
        setDialogSubcategories([]);
      } finally {
        setLoadingDialogSubcategories(false);
      }
    };

    fetchDialogSubcategories();
  }, [newProductCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(labelData.categoryId, labelData.subcategoryId, productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [labelData.categoryId, labelData.subcategoryId, productSearch]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("label_categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      console.log("Fetched categories:", data);
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async (categoryId?: string, subcategoryId?: string, search?: string) => {
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
          label_subcategories:subcategory_id (
            id,
            name
          )
        `)
        .order("name")
        .limit(50);

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      // Filter by subcategory if one is selected
      if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Defensive: Ensure data is array and filter out any malformed products
      const validProducts = (data || []).filter(product => 
        product && 
        typeof product.id === 'string' && 
        typeof product.name === 'string'
      );
      
      console.log("Fetched products:", validProducts.length, "valid products");
      setProducts(validProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]); // Set to empty array on error
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a category name",
        variant: "destructive"
      });
      return;
    }

    setCreatingCategory(true);

    try {
      const { data, error } = await supabase
        .from("label_categories")
        .insert({
          name: newCategoryName.trim()
        })
        .select()
        .single();

      if (error) {
        // Check for duplicate error (PostgreSQL error code 23505)
        if (error.code === "23505") {
          toast({
            title: "Category Already Exists",
            description: `A category named "${newCategoryName}" already exists in your organization.`,
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Category Created",
        description: `"${newCategoryName}" has been created successfully.`
      });

      // Update local state and select the new category
      setCategories(prev => [...prev, data]);
      setLabelData(prev => ({
        ...prev,
        categoryId: data.id,
        categoryName: data.name,
        productId: "",
        productName: ""
      }));

      // Reset dialog state
      setNewCategoryName("");
      setShowCreateCategoryDialog(false);
      setCategorySearch("");
      setOpenCategory(false);

    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a product name",
        variant: "destructive"
      });
      return;
    }

    if (!newProductCategory) {
      toast({
        title: "Category Required",
        description: "Please select a category for the product",
        variant: "destructive"
      });
      return;
    }

    setCreatingProduct(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: newProductName.trim(),
          category_id: newProductCategory,
          subcategory_id: newProductSubcategory || null,
          organization_id: organizationId  // Add organization_id to pass RLS
        })
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
          label_subcategories:subcategory_id (
            id,
            name
          )
        `)
        .single();

      if (error) {
        // Check for duplicate error (PostgreSQL error code 23505)
        if (error.code === "23505") {
          toast({
            title: "Product Already Exists",
            description: `A product named "${newProductName}" already exists in your organization.`,
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Product Created",
        description: `"${newProductName}" has been created successfully.`
      });

      // Update local state and select the new product
      setProducts(prev => [...prev, data]);
      
      // Update form with the newly created product
      // This will also update category/subcategory if they differ from current selection
      setLabelData(prev => ({
        ...prev,
        productId: data.id,
        productName: data.name,
        // Update category (may be different from current if dialog category != form category)
        categoryId: data.category_id || prev.categoryId,
        categoryName: data.label_categories?.name || prev.categoryName,
        // Update subcategory (may be empty or different)
        subcategoryId: data.subcategory_id || "",
        subcategoryName: data.label_subcategories?.name || "",
        unit: data.measuring_units?.abbreviation || ""
      }));

      // Reset dialog state
      setNewProductName("");
      setNewProductCategory("");
      setNewProductSubcategory("");
      setShowCreateProductDialog(false);
      setProductSearch("");
      setOpenProduct(false);

    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive"
      });
    } finally {
      setCreatingProduct(false);
    }
  };

  const calculateExpiryDate = (condition: string, prepDate: string) => {
    const conditionData = CONDITIONS.find(c => c.value === condition);
    if (!conditionData || !prepDate) return "";

    const prep = new Date(prepDate);
    prep.setDate(prep.getDate() + conditionData.days);
    return prep.toISOString().split('T')[0];
  };

  const handleConditionChange = (value: string) => {
    setLabelData(prev => {
      const expiry = calculateExpiryDate(value, prev.prepDate);
      return {
        ...prev,
        condition: value,
        expiryDate: expiry
      };
    });
    setOpenCondition(false);
  };

  const handlePrepDateChange = (date: string) => {
    setLabelData(prev => {
      const expiry = prev.condition ? calculateExpiryDate(prev.condition, date) : "";
      return {
        ...prev,
        prepDate: date,
        expiryDate: expiry
      };
    });
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // When selecting a product, update ALL related fields including category and subcategory
    setLabelData(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      unit: product.measuring_units?.abbreviation || "",
      // Update category from product (this will trigger subcategory fetch)
      categoryId: product.category_id || prev.categoryId,
      categoryName: product.label_categories?.name || prev.categoryName,
      // Update subcategory from product
      subcategoryId: product.subcategory_id || "",
      subcategoryName: product.label_subcategories?.name || ""
    }));
    setOpenProduct(false);
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a draft name",
        variant: "destructive"
      });
      return;
    }

    setSavingDraft(true);

    try {
      // user_id, created_at, updated_at são gerados automaticamente pelo banco
      const { error } = await supabase
        .from("label_drafts")
        .insert({
          draft_name: draftName.trim(),
          form_data: labelData as any, // Cast to any to match Json type
          user_id: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (error) throw error;

      toast({
        title: "Draft Saved",
        description: `Draft "${draftName}" has been saved successfully.`
      });

      setDraftName("");
      setShowSaveDraftDialog(false);

    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive"
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSave = async () => {
    if (!labelData.productId || !labelData.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Save allergens to product if any are selected
    if (labelData.productId && selectedAllergenIds.length > 0) {
      await updateProductAllergens(labelData.productId, selectedAllergenIds);
    }

    onSave?.(labelData);
  };

  const handlePrint = async () => {
    if (!labelData.productId || !labelData.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Save allergens to product if any are selected
    if (labelData.productId && selectedAllergenIds.length > 0) {
      const success = await updateProductAllergens(labelData.productId, selectedAllergenIds);
      if (!success) {
        toast({
          title: "Warning",
          description: "Failed to save allergen information, but continuing with print",
          variant: "destructive"
        });
      }
    }

    onPrint?.(labelData);
  };

  // Show loading state while organization ID is being fetched
  if (!organizationId && user?.id) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading organization information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button onClick={onCancel} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">Create Label</h2>
            <p className="text-muted-foreground">Fill in the information for your food label</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSaveDraftDialog(true)} variant="outline" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Label
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Popover open={openCategory} onOpenChange={setOpenCategory}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCategory}
                  className="w-full justify-between"
                >
                  {labelData.categoryName || "Select category..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start" side="bottom">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search category..." 
                    value={categorySearch}
                    onValueChange={setCategorySearch}
                  />
                  <CommandList>
                    {filteredCategories.length === 0 && (
                      <CommandEmpty>
                        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            No category found. Would you like to create one?
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewCategoryName(categorySearch);
                              setShowCreateCategoryDialog(true);
                              setOpenCategory(false);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Create "{categorySearch || 'New Category'}"
                          </Button>
                        </div>
                      </CommandEmpty>
                    )}
                    <CommandGroup>
                      <CommandItem
                        value="All Categories"
                        onSelect={() => {
                          // "All Categories" selection:
                          // - Clears subcategory (disabled when "all")
                          // - Clears product (will show all products)
                          // - Clears search to start fresh
                          setLabelData(prev => ({
                            ...prev,
                            categoryId: "all",
                            categoryName: "All Categories",
                            subcategoryId: "",
                            subcategoryName: "",
                            productId: "",
                            productName: ""
                          }));
                          setProductSearch("");
                          setCategorySearch("");
                          setOpenCategory(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            labelData.categoryId === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Categories
                      </CommandItem>
                      {filteredCategories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            // Category selection:
                            // - Sets new category
                            // - Clears subcategory (will load new subcategories via useEffect)
                            // - Clears product (will filter by new category)
                            // - Clears search to start fresh
                            setLabelData(prev => ({
                              ...prev,
                              categoryId: category.id,
                              categoryName: category.name,
                              subcategoryId: "",
                              subcategoryName: "",
                              productId: "",
                              productName: ""
                            }));
                            setProductSearch("");
                            setCategorySearch("");
                            setOpenCategory(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              labelData.categoryId === category.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Subcategory - Always visible */}
          <div className="space-y-2">
            <Label htmlFor="subcategory">
              Subcategory (Optional)
              {!labelData.categoryId && <span className="text-xs text-muted-foreground ml-2">- Select a category first</span>}
            </Label>
            {labelData.categoryId && labelData.categoryId !== "all" ? (
              loadingFormSubcategories ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading subcategories...
                </div>
              ) : (
                <Select
                  value={labelData.subcategoryId || "none"}
                  onValueChange={(value) => {
                    // Subcategory selection:
                    // - Keeps current category
                    // - Sets new subcategory (or "" for "None")
                    // - Clears product (will filter by category + subcategory)
                    // - Clears search to start fresh
                    const subcategory = formSubcategories.find(s => s.id === value);
                    setLabelData(prev => ({
                      ...prev,
                      subcategoryId: value === "none" ? "" : value,
                      subcategoryName: value === "none" ? "" : (subcategory?.name || ""),
                      productId: "",
                      productName: ""
                    }));
                    // Clear product search when subcategory changes
                    setProductSearch("");
                  }}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select a subcategory..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Array.isArray(formSubcategories) && formSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            ) : (
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category first..." />
                </SelectTrigger>
              </Select>
            )}
            {labelData.categoryId && labelData.categoryId !== "all" && !loadingFormSubcategories && (
              <p className="text-xs text-muted-foreground">
                {formSubcategories.length > 0 
                  ? `${formSubcategories.length} subcategor${formSubcategories.length === 1 ? 'y' : 'ies'} available`
                  : "No subcategories available for this category"}
              </p>
            )}
          </div>

          {/* Product */}
          <div className="space-y-2">
            <Label>Product *</Label>
            <Popover open={openProduct} onOpenChange={setOpenProduct}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProduct}
                  className="w-full justify-between"
                >
                  {labelData.productName || "Select product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start" side="bottom">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search product..." 
                    value={productSearch}
                    onValueChange={setProductSearch}
                  />
                  <CommandList>
                    {products.length === 0 && (
                      <CommandEmpty>
                        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            No product found. Would you like to create one?
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewProductName(productSearch);
                              setNewProductCategory(labelData.categoryId === "all" ? "" : labelData.categoryId);
                              setShowCreateProductDialog(true);
                              setOpenProduct(false);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Create "{productSearch || 'New Product'}"
                          </Button>
                        </div>
                      </CommandEmpty>
                    )}
                    {Array.isArray(products) && products.length > 0 && (
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => handleProductChange(product.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                labelData.productId === product.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {product.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label>Condition *</Label>
            <Popover open={openCondition} onOpenChange={setOpenCondition}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCondition}
                  className="w-full justify-between"
                >
                  {CONDITIONS.find(c => c.value === labelData.condition)?.label || "Select condition..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search condition..." />
                  <CommandList>
                    <CommandEmpty>No condition found.</CommandEmpty>
                    <CommandGroup>
                      {CONDITIONS.map((condition) => (
                        <CommandItem
                          key={condition.value}
                          value={condition.label}
                          onSelect={() => handleConditionChange(condition.value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              labelData.condition === condition.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{condition.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {condition.days} day{condition.days !== 1 ? 's' : ''} shelf life
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Prepared By - Read Only */}
          <div className="space-y-2">
            <Label>Prepared By</Label>
            <Input
              value={labelData.preparedByName}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Prep Date */}
          <div className="space-y-2">
            <Label htmlFor="prep-date">Prep Date</Label>
            <Input
              id="prep-date"
              type="date"
              value={labelData.prepDate}
              onChange={(e) => handlePrepDateChange(e.target.value)}
            />
          </div>

          {/* Expiry Date - Auto Calculated */}
          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date</Label>
            <Input
              id="expiry-date"
              type="date"
              value={labelData.expiryDate}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Automatically calculated based on condition
            </p>
          </div>

          {/* Quantity - Optional */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Optional)</Label>
              <Input
                id="quantity"
                type="number"
                value={labelData.quantity}
                onChange={(e) => setLabelData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select 
                value={labelData.unit} 
                onValueChange={(value) => setLabelData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg (Kilogram)</SelectItem>
                  <SelectItem value="g">g (Gram)</SelectItem>
                  <SelectItem value="L">L (Liter)</SelectItem>
                  <SelectItem value="mL">mL (Milliliter)</SelectItem>
                  <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                  <SelectItem value="oz">oz (Ounce)</SelectItem>
                  <SelectItem value="lb">lb (Pound)</SelectItem>
                  <SelectItem value="gal">gal (Gallon)</SelectItem>
                  <SelectItem value="servings">Servings</SelectItem>
                  <SelectItem value="portions">Portions</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Auto-loaded from product or select manually
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allergen Selector - Only show if product is selected */}
      {labelData.productId && (
        <Card>
          <CardHeader>
            <CardTitle>Allergen Information</CardTitle>
          </CardHeader>
          <CardContent>
            <AllergenSelectorEnhanced
              selectedAllergenIds={selectedAllergenIds}
              onChange={setSelectedAllergenIds}
              productId={labelData.productId}
              showCommonOnly={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Label Preview with QR Code */}
      <LabelPreview
        productName={labelData.productName}
        categoryName={labelData.categoryName}
        condition={labelData.condition}
        preparedByName={labelData.preparedByName}
        prepDate={labelData.prepDate}
        expiryDate={labelData.expiryDate}
        quantity={labelData.quantity}
        unit={labelData.unit}
        batchNumber={labelData.batchNumber}
        productId={labelData.productId}
        templateType="default"
        templateName={selectedTemplate?.name}
        isBlankTemplate={selectedTemplate?.name?.toLowerCase() === "blank"}
      />

      {/* Create Category Confirmation Dialog */}
      <AlertDialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create a new category with the following name?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name..."
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !creatingCategory) {
                  handleCreateCategory();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creatingCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCreateCategory} 
              disabled={creatingCategory || !newCategoryName.trim()}
            >
              {creatingCategory ? "Creating..." : "Create Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Draft Dialog */}
      <AlertDialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Give your draft a name to save your progress and continue later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="draft-name">Draft Name *</Label>
            <Input
              id="draft-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g., Chicken Breast Label"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !savingDraft && draftName.trim()) {
                  handleSaveDraft();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDraft}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveDraft} 
              disabled={savingDraft || !draftName.trim()}
            >
              {savingDraft ? "Saving..." : "Save Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Product Confirmation Dialog */}
      <AlertDialog open={showCreateProductDialog} onOpenChange={setShowCreateProductDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Product</AlertDialogTitle>
            <AlertDialogDescription>
              Fill in the details to create a new product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Enter product name..."
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creatingProduct && newProductName.trim() && newProductCategory) {
                    handleCreateProduct();
                  }
                }}
              />
              
              {/* Duplicate Product Warning */}
              {organizationId && (
                <DuplicateProductWarning
                  similarProducts={similarProducts}
                  isLoading={isDuplicateCheckLoading}
                  isDuplicate={isDuplicate}
                  error={duplicateCheckError}
                  onSelectProduct={(product) => {
                    // Close the create product dialog
                    setShowCreateProductDialog(false);
                    
                    // Find the full product details
                    const existingProduct = products.find(p => p.id === product.product_id);
                    if (existingProduct) {
                      // Set the selected product in the main form
                      setLabelData(prev => ({
                        ...prev,
                        productId: existingProduct.id,
                        productName: existingProduct.name,
                        categoryId: existingProduct.category_id || "",
                        categoryName: existingProduct.label_categories?.name || "",
                        subcategoryId: existingProduct.subcategory_id || "",
                        subcategoryName: existingProduct.label_subcategories?.name || ""
                      }));
                      
                      toast({
                        title: "Product Selected",
                        description: `Using existing product: ${existingProduct.name}`,
                      });
                    }
                  }}
                  showProceedButton={false}
                />
              )}
            </div>
            <div>
              <Label htmlFor="product-category">Category *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between mt-2"
                  >
                    {categories.find(c => c.id === newProductCategory)?.name || "Select category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={() => setNewProductCategory(category.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newProductCategory === category.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Subcategory Selection - Always visible */}
            <div>
              <Label htmlFor="product-subcategory">
                Subcategory (Optional)
                {!newProductCategory && <span className="text-xs text-muted-foreground ml-2">- Select a category first</span>}
              </Label>
              <div className="mt-2">
                {newProductCategory ? (
                  loadingDialogSubcategories ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading subcategories...
                    </div>
                  ) : (
                    <Select
                      value={newProductSubcategory || "none"}
                      onValueChange={(value) => setNewProductSubcategory(value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Array.isArray(dialogSubcategories) && dialogSubcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                ) : (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category first..." />
                    </SelectTrigger>
                  </Select>
                )}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creatingProduct}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCreateProduct} 
              disabled={creatingProduct || !newProductName.trim() || !newProductCategory || isDuplicate}
            >
              {creatingProduct ? "Creating..." : "Create Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}