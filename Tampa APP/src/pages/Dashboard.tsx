import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChefHat, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Package,
  TrendingUp,
  Users,
  Calendar,
  Tags,
  Thermometer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/StatsCard";
import { AlertsDashboard } from "@/components/AlertsDashboard";
import ExpiryAlerts from "@/components/ExpiryAlerts";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { WasteTracker } from "@/components/analytics/WasteTracker";
import { ComplianceReports } from "@/components/analytics/ComplianceReports";
import { EfficiencyMetrics } from "@/components/analytics/EfficiencyMetrics";
import { format, isAfter, isBefore, addDays } from "date-fns";

export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWaste, setTotalWaste] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentActivity();
    fetchWasteTotal();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      
      // Fetch recent prepared items with recipe details
      const { data: preparedItems, error } = await supabase
        .from('prepared_items')
        .select(`
          *,
          recipes:recipe_id (
            name,
            hold_time_days,
            allergens
          )
        `)
        .order('prepared_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const processedActivity = preparedItems?.map(item => {
        const recipe = item.recipes as any;
        
        // Calculate expiry based on hold time in days
        const expiryDate = addDays(new Date(item.prepared_at), recipe.hold_time_days || 3);
        const isExpiringSoon = isAfter(new Date(), addDays(expiryDate, -1)); // 1 day before expiry
        const isExpired = isAfter(new Date(), expiryDate);

        return {
          ...item,
          recipe_name: recipe?.name || 'Unknown Recipe',
          expiry_date: expiryDate,
          status: isExpired ? 'expired' : isExpiringSoon ? 'expiring' : 'good',
          allergens: recipe?.allergens || []
        };
      }) || [];

      setRecentActivity(processedActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      toast({
        title: "Error",
        description: "Failed to fetch recent activity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWasteTotal = async () => {
    try {
      const { data: wasteLogs, error } = await supabase
        .from('waste_logs')
        .select('estimated_cost');

      if (error) throw error;

      const total = wasteLogs?.reduce((sum, log) => sum + (log.estimated_cost || 0), 0) || 0;
      setTotalWaste(total);
    } catch (error) {
      console.error('Error fetching waste total:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kitchen Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your kitchen operations and food safety
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="hero">Generate Report</Button>
        </div>
      </div>

      {/* Active Alerts Dashboard */}
      <AlertsDashboard items={recentActivity} />

      {/* Compliance Score and Temperature Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StatsCard
            title="Compliance Score"
            value="98.5%"
            change="+0.3% this week"
            changeType="positive"
            icon={CheckCircle}
          />
          <StatsCard
            title="Total Waste Cost"
            value={`$${totalWaste.toFixed(2)}`}
            icon={TrendingUp}
          />
        </div>
        
        {/* Temperature Monitoring */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Thermometer className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="font-semibold">Temperature Alerts</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Walk-in Cooler</span>
                <span className="text-sm text-success">3°C</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Normal range</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Freezer Unit 2</span>
                <span className="text-sm text-warning">-17°C</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Slightly high</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Routine and Today's Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Routine */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-accent/50 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent-foreground" />
            </div>
            <h3 className="font-semibold">Daily Routine</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Opening Checklist</span>
              <span className="text-sm text-success font-medium">Complete</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Temperature Logs</span>
              <span className="text-sm text-warning font-medium">In Progress</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Cleaning Tasks</span>
              <span className="text-sm text-muted-foreground">Scheduled</span>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold">Today's Schedule</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Morning Prep</span>
              <span className="text-sm text-success font-medium">Complete</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Lunch Service</span>
              <span className="text-sm text-warning font-medium">In Progress</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Evening Prep</span>
              <span className="text-sm text-muted-foreground">Scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activity */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-accent/50 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-accent-foreground" />
            </div>
            <h3 className="font-semibold">Recent Preparations</h3>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity</div>
            ) : (
              recentActivity.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium">{item.recipe_name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">
                      Expires: {format(new Date(item.expiry_date), 'dd/MM HH:mm')}
                    </p>
                    <Badge 
                      variant={
                        item.status === 'expired' ? 'destructive' : 
                        item.status === 'expiring' ? 'default' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {item.status === 'expired' ? 'Expired' : 
                       item.status === 'expiring' ? 'Expiring' : 
                       'Fresh'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.prepared_at), 'MMM dd, HH:mm')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin Panel - Shows admin status and staff management */}
      <AdminPanel />

      {/* Phase 4 Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WasteTracker />
        <ComplianceReports />
        <EfficiencyMetrics />
      </div>

      {/* Expiry Alerts */}
      <ExpiryAlerts />
    </div>
  );
}