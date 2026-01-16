import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Star } from "lucide-react";

interface EfficiencyData {
  recipe_name: string;
  time_efficiency_ratio: number;
  avg_quality: number;
  total_produced: number;
  production_count: number;
}

export function EfficiencyMetrics() {
  const [metrics, setMetrics] = useState<EfficiencyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const { data, error } = await supabase
      .from("efficiency_analytics")
      .select("*")
      .limit(5);

    if (error) {
      // Handle case where view doesn't exist (PGRST205 error)
      if (error.code === 'PGRST205') {
        console.warn('efficiency_analytics view not found in database schema');
        setMetrics([]);
        setLoading(false);
        return;
      }
      console.error('Error fetching efficiency metrics:', error);
      setMetrics([]);
      setLoading(false);
      return;
    }

    if (data) {
      setMetrics(data);
    }
    setLoading(false);
  };

  const getEfficiencyColor = (ratio: number) => {
    if (ratio <= 1.1) return "text-green-500";
    if (ratio <= 1.3) return "text-yellow-500";
    return "text-red-500";
  };

  const getEfficiencyLabel = (ratio: number) => {
    if (ratio <= 1.1) return "Excellent";
    if (ratio <= 1.3) return "Good";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Efficiency Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Production Efficiency
        </CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">No production data yet</p>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric, index) => {
              const efficiency = metric.time_efficiency_ratio || 1;
              const qualityPercent = ((metric.avg_quality || 0) / 5) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{metric.recipe_name}</span>
                    <span className={`text-xs font-medium ${getEfficiencyColor(efficiency)}`}>
                      {getEfficiencyLabel(efficiency)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Progress value={Math.min((1 / efficiency) * 100, 100)} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(efficiency * 100).toFixed(0)}% of planned time
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Progress value={qualityPercent} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {metric.avg_quality?.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {metric.production_count} batches • {metric.total_produced} units produced
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
