import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Package, 
  QrCode, 
  ClipboardList, 
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Scan,
  Users
} from "lucide-react";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import ProductLabeling from "@/components/labeling/ProductLabeling";
import InventoryDashboard from "@/components/inventory/InventoryDashboard";
import ManagerPortal from "@/components/manager/ManagerPortal";
import StockControl from "@/components/stock/StockControl";

type ActiveSection = 'dashboard' | 'labeling' | 'inventory' | 'manager' | 'stock';

const Index = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');

  const navigationItems = [
    { 
      id: 'dashboard' as ActiveSection, 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      description: 'Overview & Analytics' 
    },
    { 
      id: 'labeling' as ActiveSection, 
      label: 'Product Labels', 
      icon: QrCode, 
      description: 'Generate & Print Labels' 
    },
    { 
      id: 'inventory' as ActiveSection, 
      label: 'Inventory', 
      icon: Package, 
      description: 'Stock Tracking' 
    },
    { 
      id: 'manager' as ActiveSection, 
      label: 'Manager Portal', 
      icon: Users, 
      description: 'Approvals & Tasks' 
    },
    { 
      id: 'stock' as ActiveSection, 
      label: 'Stock Control', 
      icon: Scan, 
      description: 'Quick Operations' 
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'labeling':
        return <ProductLabeling />;
      case 'inventory':
        return <InventoryDashboard />;
      case 'manager':
        return <ManagerPortal />;
      case 'stock':
        return <StockControl />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-kitchen-display text-foreground">KitchenSync</h1>
                <p className="text-sm text-muted-foreground">Inventory & Food Safety Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-status-safe border-status-safe">
                <div className="status-indicator status-safe mr-2"></div>
                System Online
              </Badge>
              <div className="text-sm text-muted-foreground">
                Last Updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-medium)] ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isActive ? 'gradient-brand' : 'bg-kitchen-surface'
                    }`}>
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.label}</CardTitle>
                      <CardDescription className="text-xs">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="transition-all duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;