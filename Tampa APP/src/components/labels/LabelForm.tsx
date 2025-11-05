import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Printer, 
  Save, 
  X, 
  Package,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LabelData {
  categoryId: string;
  categoryName: string;
  productId: string;
  productName: string;
  condition: string;
  preparedBy: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  quantity: string;
  unit: string;
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
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  measuring_unit_id: string | null;
  measuring_units?: {
    name: string;
    abbreviation: string;
  };
}

const CONDITIONS = [
  { value: "fresh", label: "Fresh", days: 1 },
  { value: "cooked", label: "Cooked", days: 3 },
  { value: "frozen", label: "Frozen", days: 30 },
  { value: "dry", label: "Dry Storage", days: 90 },
  { value: "refrigerated", label: "Refrigerated", days: 7 },
];

export function LabelForm({ onSave, onPrint, onCancel, selectedUser }: LabelFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openCategory, setOpenCategory] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openCondition, setOpenCondition] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [labelData, setLabelData] = useState<LabelData>({
    categoryId: "",
    categoryName: "",
    productId: "",
    productName: "",
    condition: "",
    preparedBy: selectedUser?.user_id || "",
    preparedByName: selectedUser?.display_name || "",
    prepDate: today,
    expiryDate: "",
    quantity: "",
    unit: ""
  });

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
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("label_categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          measuring_unit_id,
          measuring_units:measuring_unit_id (
            name,
            abbreviation
          )
        `)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
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

    setLabelData(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      unit: product.measuring_units?.abbreviation || ""
    }));
    setOpenProduct(false);
  };

  const handleSave = () => {
    if (!labelData.productId || !labelData.categoryId || !labelData.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    onSave?.(labelData);
  };

  const handlePrint = () => {
    if (!labelData.productId || !labelData.categoryId || !labelData.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    onPrint?.(labelData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create Label</h2>
          <p className="text-muted-foreground">Fill in the information for your food label</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Label
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="ghost">
              <X className="w-4 h-4" />
            </Button>
          )}
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
                          onSelect={() => {
                            setLabelData(prev => ({
                              ...prev,
                              categoryId: category.id,
                              categoryName: category.name
                            }));
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
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search product..." />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
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
              <Label>Unit</Label>
              <Input
                value={labelData.unit}
                readOnly
                className="bg-muted"
                placeholder="Auto-loaded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Label Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Label Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-2 text-black">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">{labelData.productName || "Product Name"}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {labelData.categoryName || "Category"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Condition:</strong> {CONDITIONS.find(c => c.value === labelData.condition)?.label || "N/A"}
              </div>
              <div>
                <strong>Prepared by:</strong> {labelData.preparedByName || "N/A"}
              </div>
              <div>
                <strong>Prep Date:</strong> {labelData.prepDate ? new Date(labelData.prepDate).toLocaleDateString() : "N/A"}
              </div>
              <div>
                <strong>Expiry:</strong> {labelData.expiryDate ? new Date(labelData.expiryDate).toLocaleDateString() : "N/A"}
              </div>
              {labelData.quantity && (
                <div className="col-span-2">
                  <strong>Quantity:</strong> {labelData.quantity} {labelData.unit}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}