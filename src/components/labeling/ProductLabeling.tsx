import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  QrCode, 
  Calendar, 
  Package, 
  Printer,
  Download,
  Eye,
  Plus,
  RotateCcw
} from "lucide-react";

const ProductLabeling = () => {
  const [labelData, setLabelData] = useState({
    productName: "",
    category: "",
    preparedDate: "",
    expiryDate: "",
    batchNumber: "",
    instructions: "",
    allergens: ""
  });

  const [recentLabels, setRecentLabels] = useState([
    {
      id: "LBL001",
      productName: "Chicken Salad",
      category: "Prepared Foods",
      expiryDate: "2024-12-20",
      status: "printed",
      createdAt: "2024-12-17 14:30"
    },
    {
      id: "LBL002", 
      productName: "Beef Stock",
      category: "Stocks & Sauces",
      expiryDate: "2024-12-22",
      status: "pending",
      createdAt: "2024-12-17 13:45"
    },
    {
      id: "LBL003",
      productName: "House Marinade",
      category: "Marinades",
      expiryDate: "2024-12-25",
      status: "printed", 
      createdAt: "2024-12-17 12:15"
    }
  ]);

  const categories = [
    "Prepared Foods",
    "Stocks & Sauces", 
    "Marinades",
    "Dairy Products",
    "Meat & Poultry",
    "Vegetables",
    "Frozen Items",
    "Dry Goods"
  ];

  const handleInputChange = (field: string, value: string) => {
    setLabelData(prev => ({ ...prev, [field]: value }));
  };

  const generateQRCode = () => {
    const qrData = {
      id: `LBL${Date.now()}`,
      product: labelData.productName,
      expiry: labelData.expiryDate,
      batch: labelData.batchNumber
    };
    return `QR:${JSON.stringify(qrData)}`;
  };

  const handleCreateLabel = () => {
    const newLabel = {
      id: `LBL${String(recentLabels.length + 1).padStart(3, '0')}`,
      productName: labelData.productName,
      category: labelData.category,
      expiryDate: labelData.expiryDate,
      status: "pending" as const,
      createdAt: new Date().toLocaleString()
    };
    
    setRecentLabels(prev => [newLabel, ...prev]);
    
    // Reset form
    setLabelData({
      productName: "",
      category: "",
      preparedDate: "",
      expiryDate: "",
      batchNumber: "",
      instructions: "",
      allergens: ""
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'printed': return 'status-safe';
      case 'pending': return 'status-warning';
      default: return 'status-unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Label Creation Form */}
        <Card className="kitchen-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>Create Product Label</span>
            </CardTitle>
            <CardDescription>Generate labels with QR codes for inventory tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  placeholder="Enter product name"
                  value={labelData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={labelData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparedDate">Prepared Date</Label>
                <Input
                  id="preparedDate"
                  type="date"
                  value={labelData.preparedDate}
                  onChange={(e) => handleInputChange('preparedDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={labelData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                placeholder="Enter batch number"
                value={labelData.batchNumber}
                onChange={(e) => handleInputChange('batchNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Allergens</Label>
              <Input
                id="allergens"
                placeholder="List allergens (comma separated)"
                value={labelData.allergens}
                onChange={(e) => handleInputChange('allergens', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Storage instructions, handling notes..."
                value={labelData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateLabel}
                className="flex-1 gradient-brand text-white"
                disabled={!labelData.productName || !labelData.expiryDate}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Label
              </Button>
              <Button variant="outline" className="touch-target">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="touch-target">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Label Preview */}
        <Card className="kitchen-card">
          <CardHeader>
            <CardTitle>Label Preview</CardTitle>
            <CardDescription>Preview how your label will look when printed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-6 bg-kitchen-surface">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-foreground rounded-lg flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-background" />
                  </div>
                  <div className="text-right">
                    <p className="font-kitchen-label text-muted-foreground">BATCH</p>
                    <p className="font-mono text-sm">{labelData.batchNumber || "---"}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-kitchen-display text-lg">
                    {labelData.productName || "Product Name"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {labelData.category || "Category"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-kitchen-label text-muted-foreground">PREPARED</p>
                    <p>{labelData.preparedDate || "---"}</p>
                  </div>
                  <div>
                    <p className="font-kitchen-label text-muted-foreground">EXPIRES</p>
                    <p className="font-medium">{labelData.expiryDate || "---"}</p>
                  </div>
                </div>

                {labelData.allergens && (
                  <div>
                    <p className="font-kitchen-label text-muted-foreground">ALLERGENS</p>
                    <p className="text-sm text-status-warning">{labelData.allergens}</p>
                  </div>
                )}

                {labelData.instructions && (
                  <div>
                    <p className="font-kitchen-label text-muted-foreground">INSTRUCTIONS</p>
                    <p className="text-xs">{labelData.instructions}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <Button className="flex-1" variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </Button>
              <Button variant="outline" className="touch-target">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Labels */}
      <Card className="kitchen-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Recent Labels</span>
          </CardTitle>
          <CardDescription>Recently created product labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLabels.map((label) => (
              <div key={label.id} className="flex items-center justify-between p-3 rounded-lg bg-kitchen-surface border border-border">
                <div className="flex items-center space-x-3">
                  <div className={`status-indicator ${getStatusColor(label.status)}`}></div>
                  <div>
                    <p className="font-medium text-foreground">{label.productName}</p>
                    <p className="text-sm text-muted-foreground">{label.category} • {label.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium">{new Date(label.expiryDate).toLocaleDateString()}</p>
                  </div>
                  
                  <Badge variant="outline" className={getStatusColor(label.status)}>
                    {label.status}
                  </Badge>
                  
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="touch-target">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="touch-target">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductLabeling;