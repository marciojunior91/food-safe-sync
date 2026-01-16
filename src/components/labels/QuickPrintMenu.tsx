import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, Check, ChevronsUpDown, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";

interface Product {
  id: string;
  name: string;
  category?: {
    id: string;
    name: string;
  };
}

interface LabelTemplate {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

interface LastPrintData {
  condition: string;
  quantity: string;
  unit: string;
}

interface QuickPrintMenuProps {
  onSuccess?: () => void;
}

const SHELF_LIFE_DAYS = {
  fresh: 1,
  cooked: 3,
  frozen: 30,
  refrigerated: 7,
  thawed: 1, // 24 hours
};

export function QuickPrintMenu({ onSuccess }: QuickPrintMenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [productOpen, setProductOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchLastPrintData(selectedProduct.id);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          category:label_categories (
            id,
            name
          )
        `)
        .eq("organization_id", profile?.organization_id)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("label_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");

      if (error) throw error;
      
      setTemplates(data || []);
      
      // Auto-select default template
      const defaultTemplate = data?.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchLastPrintData = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("printed_labels")
        .select("condition, quantity, unit")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        if (data.condition) setCondition(data.condition);
        if (data.quantity) setQuantity(data.quantity);
        if (data.unit) setUnit(data.unit);
      }
    } catch (error) {
      // No previous print data, keep fields empty for user selection
      console.log("No previous print data found");
    }
  };
  const handleQuickPrint = async () => {
    if (!selectedProduct) {
      toast({
        title: "Product Required",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a label template",
        variant: "destructive",
      });
      return;
    }

    if (!condition) {
      toast({
        title: "Condition Required",
        description: "Please select a storage condition",
        variant: "destructive",
      });
      return;
    }

    if (!unit) {
      toast({
        title: "Unit Required",
        description: "Please select a measuring unit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      const prepDate = new Date();
      const shelfLifeDays = SHELF_LIFE_DAYS[condition as keyof typeof SHELF_LIFE_DAYS] || 7;
      const expiryDate = addDays(prepDate, shelfLifeDays);

      // Add to print queue
      const { error: queueError } = await supabase
        .from("print_queue")
        .insert({
          product_id: selectedProduct.id,
          category_id: selectedProduct.category?.id || null,
          template_id: selectedTemplate,
          user_id: user.id,
          prepared_by_name: profile?.display_name || user.email || "Unknown",
          prep_date: format(prepDate, "yyyy-MM-dd"),
          expiry_date: format(expiryDate, "yyyy-MM-dd"),
          condition,
          quantity: quantity || null,
          unit: unit || null,
          status: "pending",
          priority: 0,
        });

      if (queueError) throw queueError;

      toast({
        title: "Added to Queue",
        description: `${selectedProduct.name} added to print queue`,
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity("1");
      setUnit("");
      setCondition("");
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding to queue:", error);
      toast({
        title: "Error",
        description: "Failed to add label to queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Quick Print</h3>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          Existing Products Only
        </Badge>
      </div>

      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Quick Print is for existing products only. To create a new product, use the "New Label" button.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Product Search */}
        <div className="space-y-2 md:col-span-2">
          <Label>Product</Label>
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={productOpen}
                className="w-full justify-between"
              >
                {selectedProduct
                  ? selectedProduct.name
                  : "Search product..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search product..." />
                <CommandEmpty>
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>No product found.</p>
                    <p className="mt-2">Use "New Label" to create a new product.</p>
                  </div>
                </CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => {
                        setSelectedProduct(product);
                        setProductOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProduct?.id === product.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.category && (
                          <div className="text-xs text-muted-foreground">
                            {product.category.name}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Template Selector */}
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    {template.is_default && (
                      <span className="text-yellow-500">⭐</span>
                    )}
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label>Condition</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fresh">Fresh (1 day)</SelectItem>
              <SelectItem value="cooked">Cooked (3 days)</SelectItem>
              <SelectItem value="refrigerated">Refrigerated (7 days)</SelectItem>
              <SelectItem value="frozen">Frozen (30 days)</SelectItem>
              <SelectItem value="thawed">Thawed (24h)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Unit Selector */}
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
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
              <SelectItem value="servings">Servings</SelectItem>
              <SelectItem value="portions">Portions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quantity & Print Button */}
        <div className="space-y-2">
          <Label>Quantity</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1"
              placeholder="1"
            />
            <Button
              onClick={handleQuickPrint}
              disabled={loading || !selectedProduct || !condition || !unit}
            >
              <Printer className="w-4 h-4 mr-2" />
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
