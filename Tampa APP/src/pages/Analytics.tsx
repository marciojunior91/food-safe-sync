import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Download,
  Eye,
  Filter,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { useEffect } from 'react';

const complianceMetrics = [
  { category: "Label Compliance", current: 98.5, target: 95, trend: "+0.3%" },
  { category: "Temperature Logs", current: 100, target: 100, trend: "0%" },
  { category: "HACCP Checks", current: 94.2, target: 95, trend: "-1.2%" },
  { category: "Cleaning Schedule", current: 89.5, target: 90, trend: "+2.1%" }
];

const wasteData = [
  { item: "Produce", amount: "20 kg", cost: "$89", reason: "Expiration" },
  { item: "Bread", amount: "12 loaves", cost: "$24", reason: "Overproduction" },
  { item: "Dairy", amount: "30 litres", cost: "$32", reason: "Temperature Issue" },
  { item: "Proteins", amount: "7 kg", cost: "$75", reason: "Quality Control" }
];

export default function Analytics() {
  const { checkFeature, upgradeModalProps } = usePlanEnforcement();

  useEffect(() => {
    // Check if user has access to analytics when component mounts
    checkFeature('hasCostControl', 'Cost Control & Analytics');
  }, [checkFeature]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">
            Compliance tracking, operational insights, and performance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button variant="hero" className="text-white">
            <Eye className="w-4 h-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Overall Compliance"
          value="95.6%"
          change="+1.2% from last month"
          changeType="positive"
          icon={CheckCircle}
        />
        <StatsCard
          title="Failed Checks"
          value={7}
          change="3 this week"
          changeType="negative"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Cost Savings"
          value="$2,340"
          change="vs last month"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Efficiency Score"
          value="87%"
          change="+5% improvement"
          changeType="positive"
          icon={BarChart3}
        />
      </div>

      {/* Compliance Dashboard */}
      <div className="bg-card rounded-lg border shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg">Compliance Overview</h3>
            <p className="text-muted-foreground text-sm">Current period performance vs targets</p>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter by Location
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {complianceMetrics.map((metric, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">{metric.category}</h4>
                <span className={`text-xs font-medium ${
                  metric.current >= metric.target ? 'text-success' : 'text-warning'
                }`}>
                  {metric.trend}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold">{metric.current}%</span>
                  <span className="text-xs text-muted-foreground">Target: {metric.target}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metric.current >= metric.target ? 'bg-success' : 'bg-warning'
                    }`}
                    style={{ width: `${Math.min(metric.current, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trends */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Performance Trends</h3>
          
          <div className="bg-card rounded-lg border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Weekly Label Compliance</h4>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
            <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Chart showing weekly compliance trends</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Temperature Monitoring</h4>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
            <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Temperature compliance over time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Analysis & Alerts */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Waste Analysis</h3>
          
          <div className="bg-card rounded-lg border shadow-card p-6">
            <h4 className="font-medium mb-4">This Week's Waste</h4>
            <div className="space-y-3">
              {wasteData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.item}</p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.amount}</p>
                    <p className="text-sm text-destructive">{item.cost}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Weekly Waste</span>
                <span className="font-bold text-destructive">$220</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <h4 className="font-medium mb-4">Active Alerts</h4>
            <div className="space-y-3">
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-medium text-sm">Temperature Alert</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Freezer #2 temperature slightly elevated
                </p>
              </div>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="font-medium text-sm">Compliance Issue</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Missing temperature log for lunch prep
                </p>
              </div>
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-medium text-sm">Inventory Alert</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Multiple items below par level
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <h4 className="font-medium mb-4">Multi-Site Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Main Kitchen</span>
                <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">95.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>East Location</span>
                <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">97.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>West Location</span>
                <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">89.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Downtown Branch</span>
                <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">94.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal {...upgradeModalProps} />
    </div>
  );
}