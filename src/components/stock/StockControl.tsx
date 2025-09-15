import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Scan, 
  Package, 
  ArrowUp, 
  ArrowDown,
  RotateCcw,
  Trash2,
  Plus,
  Minus,
  Camera,
  Search,
  RefreshCw
} from "lucide-react";

interface StockOperation {
  id: string;
  type: 'scan' | 'manual' | 'adjustment';
  action: 'add' | 'remove' | 'relocate';
  item: string;
  quantity: number;
  location: string;
  timestamp: string;
  operator: string;
  reason?: string;
}

const StockControl = () => {
  const [scanInput, setScanInput] = useState("");
  const [quickAdjustment, setQuickAdjustment] = useState({
    item: "",
    quantity: 0,
    action: "add" as 'add' | 'remove'
  });

  const [recentOperations, setRecentOperations] = useState<StockOperation[]>([
    {
      id: "OP001",
      type: "scan",
      action: "remove",
      item: "Ground Beef (80/20)",
      quantity: 2,
      location: "Walk-in Cooler A",
      timestamp: "2024-12-17 14:45",
      operator: "Kitchen Staff",
      reason: "Used for prep"
    },
    {
      id: "OP002", 
      type: "manual",
      action: "add",
      item: "Roma Tomatoes",
      quantity: 15,
      location: "Produce Area",
      timestamp: "2024-12-17 14:30",
      operator: "Receiving"
    },
    {
      id: "OP003",
      type: "adjustment",
      action: "remove",
      item: "Whole Milk",
      quantity: 1,
      location: "Dairy Cooler", 
      timestamp: "2024-12-17 14:15",
      operator: "Manager",
      reason: "Damaged container"
    }
  ]);

  const quickAccessItems = [
    { name: "Ground Beef (80/20)", location: "Walk-in Cooler A", current: 12 },
    { name: "Chicken Breast", location: "Walk-in Cooler B", current: 18 },
    { name: "Whole Milk", location: "Dairy Cooler", current: 8 },
    { name: "Roma Tomatoes", location: "Produce Area", current: 25 },
    { name: "All-Purpose Flour", location: "Dry Storage", current: 50 },
    { name: "Frozen Shrimp", location: "Main Freezer", current: 10 }
  ];

  const handleScan = () => {
    if (!scanInput.trim()) return;
    
    // Simulate QR code processing
    const newOperation: StockOperation = {
      id: `OP${Date.now()}`,
      type: "scan",
      action: "remove", // This would be determined by the QR code
      item: scanInput,
      quantity: 1,
      location: "Scanned Location",
      timestamp: new Date().toLocaleString(),
      operator: "Current User"
    };
    
    setRecentOperations(prev => [newOperation, ...prev.slice(0, 9)]);
    setScanInput("");
  };

  const handleQuickAdjustment = (item: string, action: 'add' | 'remove', quantity: number = 1) => {
    const newOperation: StockOperation = {
      id: `OP${Date.now()}`,
      type: "manual",
      action,
      item,
      quantity,
      location: quickAccessItems.find(i => i.name === item)?.location || "Unknown",
      timestamp: new Date().toLocaleString(),
      operator: "Current User"
    };
    
    setRecentOperations(prev => [newOperation, ...prev.slice(0, 9)]);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add': return 'status-safe';
      case 'remove': return 'status-critical';
      case 'relocate': return 'status-warning';
      default: return 'status-unknown';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add': return ArrowUp;
      case 'remove': return ArrowDown;
      case 'relocate': return RotateCcw;
      default: return Package;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scanning" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanning">QR Scanning</TabsTrigger>
          <TabsTrigger value="quick">Quick Actions</TabsTrigger>
          <TabsTrigger value="batch">Batch Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="scanning">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanning Interface */}
            <Card className="kitchen-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scan className="w-5 h-5" />
                  <span>QR Code Scanner</span>
                </CardTitle>
                <CardDescription>Scan product QR codes for instant stock updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera Preview Placeholder */}
                <div className="aspect-video bg-kitchen-surface border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Camera preview will appear here</p>
                    <p className="text-sm text-muted-foreground mt-2">Point camera at QR code</p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Manual Entry */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Manual Entry</h4>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter product code or scan QR"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                    />
                    <Button onClick={handleScan} className="gradient-brand text-white">
                      <Scan className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gradient-status-safe text-white border-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stock
                  </Button>
                  <Button variant="outline" className="gradient-status-critical text-white border-none">
                    <Minus className="w-4 h-4 mr-2" />
                    Remove Stock
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Operations */}
            <Card className="kitchen-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5" />
                    <span>Recent Operations</span>
                  </div>
                  <Badge variant="outline">{recentOperations.length} operations</Badge>
                </CardTitle>
                <CardDescription>Latest stock movements and adjustments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentOperations.slice(0, 6).map((operation) => {
                  const ActionIcon = getActionIcon(operation.action);
                  
                  return (
                    <div key={operation.id} className="flex items-center space-x-3 p-3 rounded-lg bg-kitchen-surface border border-border">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        operation.action === 'add' ? 'bg-status-safe/20' :
                        operation.action === 'remove' ? 'bg-status-critical/20' :
                        'bg-status-warning/20'
                      }`}>
                        <ActionIcon className={`w-4 h-4 ${getActionColor(operation.action)}`} />
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{operation.item}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span className="capitalize">{operation.action}</span>
                          <span>•</span>
                          <span>{operation.quantity} units</span>
                          <span>•</span>
                          <span>{operation.location}</span>
                        </div>
                        {operation.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{operation.reason}</p>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-right">
                        <p>{operation.timestamp.split(' ')[1]}</p>
                        <p>{operation.operator}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick">
          <Card className="kitchen-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Quick Stock Actions</span>
              </CardTitle>
              <CardDescription>Frequently accessed items for rapid stock adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickAccessItems.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-kitchen-surface border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.location}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.current} units
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickAdjustment(item.name, 'add')}
                        className="flex-1 gradient-status-safe text-white border-none"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickAdjustment(item.name, 'remove')}
                        className="flex-1 gradient-status-critical text-white border-none"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <Card className="kitchen-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Batch Operations</span>
              </CardTitle>
              <CardDescription>Process multiple items simultaneously for efficiency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Split Screen Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Discard Queue</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-status-critical/10 border border-status-critical/20">
                        <div>
                          <p className="font-medium text-foreground text-sm">Ground Beef {i}</p>
                          <p className="text-xs text-muted-foreground">2 lbs • Expired</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full gradient-status-critical text-white">
                    Process Discards ({3} items)
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Restock Queue</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {[1,2].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-status-safe/10 border border-status-safe/20">
                        <div>
                          <p className="font-medium text-foreground text-sm">Fresh Vegetables {i}</p>
                          <p className="text-xs text-muted-foreground">5 lbs • New delivery</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full gradient-status-safe text-white">
                    Process Restocks ({2} items)
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Scan multiple items to add them to batch operations</p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Batch Scan
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Queues
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockControl;