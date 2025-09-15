import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle
} from "lucide-react";

const DashboardOverview = () => {
  const stats = [
    {
      title: "Total Items",
      value: "1,247",
      change: "+12%",
      changeType: "positive" as const,
      icon: Package,
      description: "Items in inventory"
    },
    {
      title: "Expiring Soon",
      value: "23",
      change: "+5 today",
      changeType: "warning" as const,
      icon: Clock,
      description: "Items expiring in 3 days"
    },
    {
      title: "Critical Items",
      value: "8",
      change: "-2 today",
      changeType: "critical" as const,
      icon: AlertTriangle,
      description: "Immediate attention needed"
    },
    {
      title: "Waste Value",
      value: "$156",
      change: "-$45 this week",
      changeType: "positive" as const,
      icon: DollarSign,
      description: "Total waste this month"
    }
  ];

  const inventoryCategories = [
    { name: "Dairy & Eggs", count: 156, status: "safe", percentage: 92 },
    { name: "Meat & Poultry", count: 89, status: "warning", percentage: 78 },
    { name: "Vegetables", count: 234, status: "safe", percentage: 96 },
    { name: "Dry Goods", count: 445, status: "safe", percentage: 88 },
    { name: "Frozen Items", count: 167, status: "warning", percentage: 85 },
    { name: "Beverages", count: 156, status: "critical", percentage: 65 }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: "critical",
      message: "Ground Beef expires today - 12 lbs remaining",
      time: "2 hours ago",
      status: "pending"
    },
    {
      id: 2,
      type: "warning", 
      message: "Milk supply running low - reorder needed",
      time: "4 hours ago",
      status: "pending"
    },
    {
      id: 3,
      type: "safe",
      message: "Fresh produce delivery verified and stored",
      time: "6 hours ago", 
      status: "completed"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-status-critical';
      case 'warning': return 'text-status-warning';
      case 'safe': return 'text-status-safe';
      default: return 'text-status-unknown';
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-status-safe';
      case 'warning': return 'text-status-warning';
      case 'critical': return 'text-status-critical';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="kitchen-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                <div className={`text-xs mt-2 ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Categories */}
        <Card className="kitchen-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Inventory Categories</span>
            </CardTitle>
            <CardDescription>Current stock levels by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventoryCategories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`status-indicator status-${category.status}`}></div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{category.count} items</span>
                    <Badge variant="outline" className={getStatusColor(category.status)}>
                      {category.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={category.percentage} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="kitchen-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Recent Alerts</span>
            </CardTitle>
            <CardDescription>Latest system notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-kitchen-surface border border-border">
                <div className={`status-indicator status-${alert.type} mt-1`}></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                    <div className="flex items-center space-x-1">
                      {alert.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-status-safe" />
                      ) : (
                        <XCircle className="w-4 h-4 text-status-warning" />
                      )}
                      <span className="text-xs capitalize text-muted-foreground">
                        {alert.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;