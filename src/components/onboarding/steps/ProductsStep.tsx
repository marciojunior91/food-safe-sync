// Step 3: Products Import/Entry
// Iteration 13 - MVP Sprint

import { useState } from "react";
import { Upload, Plus, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductImportData, ProductEntry, CSVImportResult } from "@/types/onboarding";
import { validateProducts } from "@/utils/onboardingValidation";
import { useToast } from "@/hooks/use-toast";

interface ProductsStepProps {
  data: Partial<ProductImportData>;
  onChange: (data: Partial<ProductImportData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRODUCT_CATEGORIES = [
  "Appetizers", "Mains", "Desserts", "Sides", "Beverages", 
  "Sauces", "Bakery", "Prep Items", "Other"
];

const COMMON_ALLERGENS = [
  "Dairy", "Eggs", "Fish", "Shellfish", "Tree Nuts", "Peanuts",
  "Wheat", "Soy", "Sesame", "Gluten"
];

export default function ProductsStep({ data, onChange, onNext, onBack }: ProductsStepProps) {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importMethod, setImportMethod] = useState<'manual' | 'csv'>(data.importMethod || 'manual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<ProductEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<ProductEntry>>({
    allergens: [],
    dietary_requirements: [],
  });

  // Handle import method change
  const handleImportMethodChange = (method: 'manual' | 'csv') => {
    setImportMethod(method);
    onChange({ ...data, importMethod: method });
  };

  // Add manual product
  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) {
      toast({
        title: "Validation Error",
        description: "Product name and category are required",
        variant: "destructive",
      });
      return;
    }

    const products = [...(data.products || []), newProduct as ProductEntry];
    onChange({ ...data, products });
    
    // Reset form
    setNewProduct({
      allergens: [],
      dietary_requirements: [],
    });
    setShowAddForm(false);
    
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to your list`,
    });
  };

  // Remove product
  const handleRemoveProduct = (index: number) => {
    const products = [...(data.products || [])];
    products.splice(index, 1);
    onChange({ ...data, products });
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const template = `name,category,allergens,dietary_requirements,description
"Margherita Pizza","Mains","Dairy,Wheat,Gluten","Vegetarian","Classic pizza with tomato and mozzarella"
"Caesar Salad","Appetizers","Dairy,Eggs,Fish","Contains Anchovy","Fresh romaine with caesar dressing"
"Chocolate Cake","Desserts","Dairy,Eggs,Wheat,Gluten","","Rich chocolate layer cake"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded",
    });
  };

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    parseCSV(file);
  };

  // Parse CSV file
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file is empty or has no data rows');
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Validate required columns
        if (!headers.includes('name') || !headers.includes('category')) {
          throw new Error('CSV must have "name" and "category" columns');
        }

        // Parse data rows
        const products: ProductEntry[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/"/g, '')) || [];
          
          if (values.length === 0) continue;

          const product: any = {};
          headers.forEach((header, index) => {
            if (values[index]) {
              if (header === 'allergens' || header === 'dietary_requirements') {
                product[header] = values[index].split(',').map(v => v.trim()).filter(Boolean);
              } else {
                product[header] = values[index];
              }
            }
          });

          if (product.name && product.category) {
            products.push(product as ProductEntry);
          }
        }

        setCsvPreview(products);
        toast({
          title: "CSV Parsed",
          description: `Found ${products.length} valid products`,
        });
      } catch (error) {
        console.error('CSV parse error:', error);
        toast({
          title: "Parse Error",
          description: error instanceof Error ? error.message : "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "Read Error",
        description: "Failed to read CSV file",
        variant: "destructive",
      });
    };

    reader.readAsText(file);
  };

  // Import CSV products
  const handleImportCSV = () => {
    onChange({ ...data, products: csvPreview });
    toast({
      title: "Products Imported",
      description: `${csvPreview.length} products have been imported`,
    });
  };

  // Handle next
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateProducts(data);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }
    
    onNext();
  };

  const toggleAllergen = (allergen: string) => {
    const allergens = newProduct.allergens || [];
    const index = allergens.indexOf(allergen);
    
    if (index > -1) {
      allergens.splice(index, 1);
    } else {
      allergens.push(allergen);
    }
    
    setNewProduct({ ...newProduct, allergens: [...allergens] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This step is optional. You can add products now or skip and add them later from the dashboard.
        </AlertDescription>
      </Alert>

      <Tabs value={importMethod} onValueChange={(v) => handleImportMethodChange(v as 'manual' | 'csv')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="csv">CSV Import</TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Your Products</h3>
            {!showAddForm && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>

          {/* Add Product Form */}
          {showAddForm && (
            <Card className="border-primary/50">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g., Margherita Pizza"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={newProduct.category || ''}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allergens</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGENS.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant={newProduct.allergens?.includes(allergen) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleAllergen(allergen)}
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleAddProduct}>
                    Add Product
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products List */}
          <div className="space-y-2">
            {(data.products || []).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No products added yet</p>
                </CardContent>
              </Card>
            ) : (
              (data.products || []).map((product, index) => (
                <Card key={index}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{product.name}</h4>
                          <Badge variant="secondary">{product.category}</Badge>
                        </div>
                        {product.allergens && product.allergens.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {product.allergens.map((allergen) => (
                              <Badge key={allergen} variant="outline" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* CSV Import Tab */}
        <TabsContent value="csv" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Import from CSV</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <FileText className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:underline">
                      Click to upload
                    </span>
                    <span className="text-sm text-muted-foreground"> or drag and drop</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {csvFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {csvFile.name}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* CSV Preview */}
            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Preview ({csvPreview.length} products)</h4>
                  <Button type="button" onClick={handleImportCSV}>
                    Import All
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {csvPreview.map((product, index) => (
                    <Card key={index}>
                      <CardContent className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          <Badge variant="secondary">{product.category}</Badge>
                          {product.allergens && product.allergens.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Allergens: {product.allergens.join(', ')}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      {(data.products || []).length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>{(data.products || []).length}</strong> product(s) ready to be added to your system
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={onNext} className="flex-1">
          Skip for Now
        </Button>
        <Button type="submit" className="flex-1" size="lg">
          Continue
        </Button>
      </div>
    </form>
  );
}
