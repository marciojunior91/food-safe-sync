import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StatsCard } from '@/components/StatsCard';
import ExpiryAlerts from '@/components/ExpiryAlerts';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { SubscriptionBadge } from '@/components/billing/SubscriptionBadge';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLabels: 0,
    labelsToday: 0,
    complianceScore: 98.5
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data: labelsData } = await supabase
        .from('printed_labels')
        .select('id, prep_date')
        .eq('organization_id', profile.organization_id);

      const totalLabels = labelsData?.length || 0;
      const today = new Date().toISOString().split('T')[0];
      const labelsToday = labelsData?.filter(label => 
        label.prep_date?.startsWith(today)
      ).length || 0;

      setStats({
        totalLabels,
        labelsToday,
        complianceScore: 98.5
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>Kitchen Dashboard</h1>
          <p className='text-muted-foreground mt-2'>
            Monitor your kitchen operations and food safety
          </p>
        </div>
        <div className='flex gap-3'>
          <Button variant='outline'>Generate Report</Button>
        </div>
      </div>

      <div className='max-w-md'>
        <SubscriptionBadge />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <StatsCard
          title='Labels Today'
          value={loading ? '...' : stats.labelsToday.toString()}
          icon={ChefHat}
        />
        <StatsCard
          title='Total Labels'
          value={loading ? '...' : stats.totalLabels.toString()}
          icon={TrendingUp}
        />
        <StatsCard
          title='Compliance Score'
          value={loading ? '...' : `${stats.complianceScore}%`}
          change='+0.3% this week'
          changeType='positive'
          icon={CheckCircle}
        />
      </div>

      <AdminPanel />
      <ExpiryAlerts />
    </div>
  );
}
