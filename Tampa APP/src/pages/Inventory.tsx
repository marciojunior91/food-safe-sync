import { 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  Plus,
  Search,
  Filter,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/StatsCard";
import ExpiryAlerts from "@/components/ExpiryAlerts";
import { usePlanEnforcement } from "@/hooks/usePlanEnforcement";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { useToast } from "@/hooks/use-toast";

const inventoryItems = [
  {
    id: 1,
    name: "Chicken Breast",
    category: "Proteins",
    currentStock: 11,
    parLevel: 23,
    unit: "kg",
    supplier: "Fresh Farms Co",
    lastOrdered: "2024-08-18",
    status: "low"
  },
  {
    id: 2,
    name: "Tomatoes",
    category: "Produce",
    currentStock: 54,
    parLevel: 45,
    unit: "kg",
    supplier: "Garden Fresh",
    lastOrdered: "2024-08-19",
    status: "good"
  },
  {
    id: 3,
    name: "Olive Oil",
    category: "Pantry",
    currentStock: 8,
    parLevel: 12,
    unit: "litres",
    supplier: "Mediterranean Supply",
    lastOrdered: "2024-08-15",
    status: "reorder"
  },
  {
    id: 4,
    name: "Rice",
    category: "Grains",
    currentStock: 0,
    parLevel: 11,
    unit: "kg",
    supplier: "Bulk Foods Inc",
    lastOrdered: "2024-08-10",
    status: "out"
  }
];

const reorderSuggestions = [
  { item: "Chicken Breast", currentStock: 11, parLevel: 23, suggested: 34 },
  { item: "Olive Oil", currentStock: 8, parLevel: 12, suggested: 15 },
  { item: "Rice", currentStock: 0, parLevel: 11, suggested: 23 }
];

export default function Inventory() {
  const { checkProductLimit, upgradeModalProps } = usePlanEnforcement();
  const { toast } = useToast();

  const handleAddItemClick = () => {
    const currentCount = inventoryItems.length;
    if (!checkProductLimit(currentCount)) {
      return; // Modal will show automatically
    }
    // TODO: Open add item dialog when implemented
    toast({
      title: "Coming Soon",
      description: "Add item functionality will be implemented soon.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">
            Track stock levels, manage suppliers, and automate reorders
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="hero" onClick={handleAddItemClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value="1,247"
          change="+23 this week"
          changeType="positive"
          icon={Package}
        />
        <StatsCard
          title="Low Stock Items"
          value={18}
          change="Need attention"
          changeType="negative"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Out of Stock"
          value={4}
          change="Critical items"
          changeType="negative"
          icon={TrendingDown}
        />
        <StatsCard
          title="Reorder Value"
          value="$2,340"
          change="Pending approval"
          changeType="neutral"
          icon={Package}
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border shadow-card p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search inventory items..." className="pl-10" />
          </div>
          <select className="h-10 px-3 py-2 text-sm border border-input bg-background rounded-md">
            <option>All Categories</option>
            <option>Proteins</option>
            <option>Produce</option>
            <option>Pantry</option>
            <option>Grains</option>
          </select>
          <select className="h-10 px-3 py-2 text-sm border border-input bg-background rounded-md">
            <option>All Status</option>
            <option>Good</option>
            <option>Low Stock</option>
            <option>Reorder</option>
            <option>Out of Stock</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Expiry Alerts Section */}
      <ExpiryAlerts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-semibold text-lg">Current Inventory</h3>
          
          <div className="space-y-4">
            {inventoryItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border shadow-card p-4 hover:shadow-card-hover transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.category} • {item.supplier}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'good' ? 'bg-success/10 text-success' :
                    item.status === 'low' ? 'bg-warning/10 text-warning' :
                    item.status === 'reorder' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {item.status === 'out' ? 'OUT OF STOCK' : 
                     item.status === 'reorder' ? 'REORDER' :
                     item.status === 'low' ? 'LOW STOCK' : 'IN STOCK'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                    <p className="font-medium">{item.currentStock} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Par Level</p>
                    <p className="font-medium">{item.parLevel} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Ordered</p>
                    <p className="font-medium">{new Date(item.lastOrdered).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.status === 'good' ? 'bg-success' :
                      item.status === 'low' ? 'bg-warning' :
                      'bg-destructive'
                    }`}
                    style={{ width: `${Math.max((item.currentStock / item.parLevel) * 100, 5)}%` }}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Update Count</Button>
                  {item.status === 'reorder' || item.status === 'out' ? (
                    <Button variant="default" size="sm">Reorder Now</Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reorder Suggestions */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">Reorder Suggestions</h3>
            <div className="space-y-3">
              {reorderSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-card rounded-lg border shadow-card p-4">
                  <h4 className="font-medium mb-2">{suggestion.item}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current:</span>
                      <span>{suggestion.currentStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Par Level:</span>
                      <span>{suggestion.parLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suggested:</span>
                      <span className="font-medium text-primary">{suggestion.suggested}</span>
                    </div>
                  </div>
                  <Button variant="default" size="sm" className="w-full mt-3">
                    Add to Order
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border shadow-card p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Bulk Update Counts
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingDown className="w-4 h-4 mr-2" />
                Generate Waste Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Low Stock Alert
              </Button>
              <Button variant="default" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Create Purchase Order
              </Button>
            </div>
          </div>

          {/* Supplier Contacts */}
          <div className="bg-card rounded-lg border shadow-card p-6">
            <h3 className="font-semibold mb-4">Supplier Quick Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>Fresh Farms Co</span>
                <Button variant="ghost" size="sm">Call</Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Garden Fresh</span>
                <Button variant="ghost" size="sm">Call</Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Mediterranean Supply</span>
                <Button variant="ghost" size="sm">Call</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal {...upgradeModalProps} />
    </div>
  );
}