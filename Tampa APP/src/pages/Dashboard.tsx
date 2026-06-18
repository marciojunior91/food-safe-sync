import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, CheckCircle, TrendingUp, ClipboardList, AlertTriangle, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StatsCard } from '@/components/StatsCard';
import { ExpiringTodayCard } from '@/components/dashboard/ExpiringTodayCard';
import { ExpiringTomorrowCard } from '@/components/dashboard/ExpiringTomorrowCard';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLabels: 0,
    labelsToday: 0,
    complianceScore: 98.5,
    tasksToday: 0,
    tasksOverdue: 0,
    tasksRecurring: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

      const today = new Date().toISOString().split('T')[0];

      // Labels (active only — excludes consumed/discarded)
      const { data: labelsData } = await supabase
        .from('printed_labels')
        .select('id, prep_date')
        .eq('organization_id', profile.organization_id);

      const totalLabels = labelsData?.length || 0;
      const labelsToday = labelsData?.filter(label =>
        label.prep_date?.startsWith(today)
      ).length || 0;

      // Routine tasks — counts that drive the dashboard buttons
      const { data: tasksData } = await supabase
        .from('routine_tasks')
        .select('id, status, scheduled_date, recurrence_pattern')
        .eq('organization_id', profile.organization_id);

      const openTasks = (tasksData || []).filter(t => t.status !== 'completed');
      const tasksToday = openTasks.filter(t => t.scheduled_date?.split('T')[0] === today).length;
      const tasksOverdue = openTasks.filter(t => {
        const d = t.scheduled_date?.split('T')[0];
        return d && d < today;
      }).length;
      const tasksRecurring = (tasksData || []).filter(t => t.recurrence_pattern).length;

      setStats({
        totalLabels,
        labelsToday,
        complianceScore: 98.5,
        tasksToday,
        tasksOverdue,
        tasksRecurring,
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

  const v = (n: number) => (loading ? '...' : n.toString());

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>Dashboard</h1>
          <p className='text-muted-foreground mt-2'>
            Monitor your kitchen operations and food safety
          </p>
        </div>
      </div>

      {/* Labels */}
      <div className='space-y-3'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Labels</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
          <div onClick={() => navigate('/labels?filter=today')} className='cursor-pointer'>
            <StatsCard title='Labels Today' value={v(stats.labelsToday)} icon={ChefHat} className='hover:shadow-lg transition-shadow h-full' />
          </div>
          <div onClick={() => navigate('/labels')} className='cursor-pointer'>
            <StatsCard title='Total Labels' value={v(stats.totalLabels)} icon={TrendingUp} className='hover:shadow-lg transition-shadow h-full' />
          </div>
          <div onClick={() => navigate('/compliance')} className='cursor-pointer'>
            <StatsCard title='Compliance Score' value={loading ? '...' : `${stats.complianceScore}%`} icon={CheckCircle} className='hover:shadow-lg transition-shadow h-full' />
          </div>
          <ExpiringTodayCard />
          <ExpiringTomorrowCard />
        </div>
      </div>

      {/* Routine tasks */}
      <div className='space-y-3'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Routine Tasks</h2>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div onClick={() => navigate('/routine-tasks?tab=today')} className='cursor-pointer'>
            <StatsCard title='Tasks Today' value={v(stats.tasksToday)} icon={ClipboardList} className='hover:shadow-lg transition-shadow h-full' />
          </div>
          <div onClick={() => navigate('/routine-tasks?tab=overdue')} className='cursor-pointer'>
            <StatsCard title='Overdue Tasks' value={v(stats.tasksOverdue)} icon={AlertTriangle} className='hover:shadow-lg transition-shadow h-full' />
          </div>
          <div onClick={() => navigate('/routine-tasks?tab=recurring')} className='cursor-pointer'>
            <StatsCard title='Recurring Tasks' value={v(stats.tasksRecurring)} icon={Repeat} className='hover:shadow-lg transition-shadow h-full' />
          </div>
        </div>
      </div>
    </div>
  );
}
