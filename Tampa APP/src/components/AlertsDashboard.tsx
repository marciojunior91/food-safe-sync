import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { isToday, isTomorrow, isYesterday, isBefore, startOfDay } from "date-fns";

interface AlertsDashboardProps {
  items: Array<{
    expiry_date: Date;
    label_count?: number;
    status: string;
  }>;
}

export function AlertsDashboard({ items }: AlertsDashboardProps) {
  const today = startOfDay(new Date());
  
  // Calculate labels for each phase
  const yesterdayLabels = items
    .filter(item => {
      const expiryDate = new Date(item.expiry_date);
      return isBefore(expiryDate, today);
    })
    .reduce((sum, item) => sum + (item.label_count || 1), 0);
  
  const todayLabels = items
    .filter(item => isToday(new Date(item.expiry_date)))
    .reduce((sum, item) => sum + (item.label_count || 1), 0);
  
  const tomorrowLabels = items
    .filter(item => isTomorrow(new Date(item.expiry_date)))
    .reduce((sum, item) => sum + (item.label_count || 1), 0);

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-lg">Active Alerts</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Yesterday - Expired */}
          <div className="flex items-center justify-between p-4 bg-destructive/5 dark:bg-destructive/20 rounded-lg border border-destructive/10 dark:border-destructive/30 backdrop-blur-sm hover:bg-destructive/10 dark:hover:bg-destructive/30 transition-all">
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="text-xs">Yesterday</Badge>
              <span className="text-sm font-medium">Expired</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-destructive">{yesterdayLabels}</p>
              <p className="text-xs text-muted-foreground">labels</p>
            </div>
          </div>

          {/* Today - About to Expire */}
          <div className="flex items-center justify-between p-4 bg-warning/5 dark:bg-warning/20 rounded-lg border border-warning/10 dark:border-warning/30 backdrop-blur-sm hover:bg-warning/10 dark:hover:bg-warning/30 transition-all">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-xs bg-warning text-warning-foreground">Today</Badge>
              <span className="text-sm font-medium">About to expire</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-warning">{todayLabels}</p>
              <p className="text-xs text-muted-foreground">labels</p>
            </div>
          </div>

          {/* Tomorrow - Will Expire */}
          <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">Tomorrow</Badge>
              <span className="text-sm font-medium">Will expire</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-success">{tomorrowLabels}</p>
              <p className="text-xs text-muted-foreground">labels</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
