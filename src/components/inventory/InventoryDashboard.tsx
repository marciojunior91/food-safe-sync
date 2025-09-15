import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Package, 
  TrendingDown,
  Calendar,
  BarChart3,
  Download,
  RefreshCw
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: 'safe' | 'warning' | 'critical';
  location: string;
  supplier: string;
  cost: number;
  lastUpdated: string;
}

const InventoryDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const inventoryItems: InventoryItem[] = [
    {
      id: "INV001",
      name: "Ground Beef (80/20)",
      category: "Meat & Poultry",
      quantity: 12,
      unit: "lbs",
      expiryDate: "2024-12-18",
      status: "critical",
      location: "Walk-in Cooler A",
      supplier: "Premium Meats Co",
      cost: 4.99,
      lastUpdated: "2024-12-17 14:30"
    },
    {
      id: "INV002",
      name: "Whole Milk",
      category: "Dairy & Eggs",
      quantity: 8,
      unit: "gallons",
      expiryDate: "2024-12-20",
      status: "warning",
      location: "Dairy Cooler",
      supplier: "Fresh Dairy Farm",
      cost: 3.49,
      lastUpdated: "2024-12-17 09:15"
    },
    {
      id: "INV003",
      name: "Roma Tomatoes",
      category: "Vegetables",
      quantity: 25,
      unit: "lbs",
      expiryDate: "2024-12-22",
      status: "safe",
      location: "Produce Area",
      supplier: "Garden Fresh Produce",
      cost: 2.99,
      lastUpdated: "2024-12-17 11:45"
    },
    {
      id: "INV004",
      name: "All-Purpose Flour",
      category: "Dry Goods",
      quantity: 50,
      unit: "lbs",
      expiryDate: "2025-06-15",
      status: "safe",
      location: "Dry Storage",
      supplier: "Bakery Supply Plus",
      cost: 1.89,
      lastUpdated: "2024-12-16 16:20"
    },
    {
      id: "INV005",
      name: "Chicken Breast",
      category: "Meat & Poultry",
      quantity: 18,
      unit: "lbs",
      expiryDate: "2024-12-19",
      status: "warning",
      location: "Walk-in Cooler B",
      supplier: "Premium Meats Co",
      cost: 6.99,
      lastUpdated: "2024-12-17 13:00"
    },
    {
      id: "INV006",
      name: "Frozen Shrimp",
      category: "Frozen Items",
      quantity: 10,
      unit: "lbs",
      expiryDate: "2025-03-15",
      status: "safe",
      location: "Main Freezer",
      supplier: "Ocean Fresh Seafood",
      cost: 12.99,
      lastUpdated: "2024-12-15 14:30"
    }
  ];

  const categories = ["all", "Meat & Poultry", "Dairy & Eggs", "Vegetables", "Dry Goods", "Frozen Items"];
  const statuses = ["all", "safe", "warning", "critical"];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'status-critical';
      case 'warning': return 'status-warning';
      case 'safe': return 'status-safe';
      default: return 'status-unknown';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      case 'safe': return 'Good';
      default: return 'Unknown';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const criticalCount = inventoryItems.filter(item => item.status === 'critical').length;
  const warningCount = inventoryItems.filter(item => item.status === 'warning').length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  return (
    <div className="space-y-6">
      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventoryItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Items</p>
                <p className="text-2xl font-bold text-status-critical">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-status-critical" />
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warning Items</p>
                <p className="text-2xl font-bold text-status-warning">{warningCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-status-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="kitchen-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>Track all items with real-time status monitoring</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex space-x-4 pt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All Status" : getStatusText(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
              
              return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-kitchen-surface border border-border hover:shadow-[var(--shadow-soft)] transition-all">
                  <div className="flex items-center space-x-4">
                    <div className={`status-indicator ${getStatusColor(item.status)}`}></div>
                    <div>
                      <h4 className="font-medium text-foreground">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.category} • {item.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{item.quantity} {item.unit}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Expires In</p>
                      <p className={`font-medium ${daysUntilExpiry <= 1 ? 'text-status-critical' : daysUntilExpiry <= 3 ? 'text-status-warning' : 'text-foreground'}`}>
                        {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days`}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="font-medium">${(item.quantity * item.cost).toFixed(2)}</p>
                    </div>
                    
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No items found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;