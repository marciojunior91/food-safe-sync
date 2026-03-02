import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/StatsCard';

export function ExpiringTomorrowCard() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpiringTomorrow();
  }, [user]);

  const fetchExpiringTomorrow = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Query: WHERE expiry_date::date = CURRENT_DATE + INTERVAL '1 day'
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('printed_labels')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .gte('expiry_date', `${tomorrowStr}T00:00:00`)
        .lt('expiry_date', `${tomorrowStr}T23:59:59`);

      if (error) throw error;

      setCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching expiring tomorrow:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    navigate('/labels?filter=expiring-tomorrow');
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <StatsCard
        title="Expiring Tomorrow"
        value={loading ? '...' : count.toString()}
        icon={Calendar}
        changeType="neutral"
        className="hover:shadow-lg transition-shadow"
      />
    </div>
  );
}
