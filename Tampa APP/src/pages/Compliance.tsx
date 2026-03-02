import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, TrendingUp, Package, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ComplianceMetrics {
  taskCompletionRate: number;
  labelUsageRate: number;
  labelDiscardRate: number;
  labelRegistryRate: number;
  overallScore: number;
}

export default function Compliance() {
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    taskCompletionRate: 0,
    labelUsageRate: 0,
    labelDiscardRate: 0,
    labelRegistryRate: 0,
    overallScore: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComplianceMetrics();
  }, [user]);

  const fetchComplianceMetrics = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Fetch labels data
      const { data: labels } = await supabase
        .from('printed_labels')
        .select('id, prep_date, expiry_date, product_name')
        .eq('organization_id', profile.organization_id);

      const totalLabels = labels?.length || 0;
      const labelsWithProduct = labels?.filter(l => l.product_name).length || 0;

      // Calculate metrics
      // TODO: Integrate with tasks when routine tasks module is ready
      const taskCompletionRate = 95; // Mock data
      const labelUsageRate = totalLabels > 0 ? (labelsWithProduct / totalLabels) * 100 : 0;
      const labelDiscardRate = 88; // Mock data - will calculate from actual discard records
      const labelRegistryRate = 92; // Mock data

      // Overall score: weighted average
      const overallScore = (
        taskCompletionRate * 0.3 +
        labelUsageRate * 0.3 +
        labelDiscardRate * 0.2 +
        labelRegistryRate * 0.2
      );

      setMetrics({
        taskCompletionRate,
        labelUsageRate: Math.round(labelUsageRate * 10) / 10,
        labelDiscardRate,
        labelRegistryRate,
        overallScore: Math.round(overallScore * 10) / 10
      });

    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Detailed breakdown of food safety compliance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Overall Compliance Score
          </CardTitle>
          <CardDescription>
            Weighted average across all compliance categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(metrics.overallScore)}`}>
              {loading ? '...' : `${metrics.overallScore}%`}
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${metrics.overallScore}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Target: 95% • Current: {metrics.overallScore}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5" />
              Task Completion Rate
            </CardTitle>
            <CardDescription>
              Routine tasks completed on time vs total assigned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.taskCompletionRate)}`}>
              {loading ? '...' : `${metrics.taskCompletionRate}%`}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${metrics.taskCompletionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Weight: 30% of overall score
            </p>
          </CardContent>
        </Card>

        {/* Label Usage Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              Label Usage Rate
            </CardTitle>
            <CardDescription>
              Products with labels vs products without labels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.labelUsageRate)}`}>
              {loading ? '...' : `${metrics.labelUsageRate}%`}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${metrics.labelUsageRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Weight: 30% of overall score
            </p>
          </CardContent>
        </Card>

        {/* Label Discard Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5" />
              Proper Discard Rate
            </CardTitle>
            <CardDescription>
              Expired products discarded correctly vs not discarded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.labelDiscardRate)}`}>
              {loading ? '...' : `${metrics.labelDiscardRate}%`}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-600 transition-all duration-500"
                style={{ width: `${metrics.labelDiscardRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Weight: 20% of overall score
            </p>
          </CardContent>
        </Card>

        {/* Label Registry Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Label Registry Rate
            </CardTitle>
            <CardDescription>
              Products registered correctly with complete information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.labelRegistryRate)}`}>
              {loading ? '...' : `${metrics.labelRegistryRate}%`}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-500"
                style={{ width: `${metrics.labelRegistryRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Weight: 20% of overall score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Formula */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Calculation</CardTitle>
          <CardDescription>
            How we calculate your overall compliance score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm bg-muted p-4 rounded-lg">
            <p className="mb-2">Overall Score = </p>
            <p className="ml-4">Task Completion Rate × 30% +</p>
            <p className="ml-4">Label Usage Rate × 30% +</p>
            <p className="ml-4">Proper Discard Rate × 20% +</p>
            <p className="ml-4">Label Registry Rate × 20%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
