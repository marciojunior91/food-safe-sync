import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'manager' | 'leader_chef' | 'staff';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [highestRole, setHighestRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setHighestRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        setLoading(false);
        return;
      }

      const userRoles = (data as UserRole[]).map(r => r.role);
      setRoles(userRoles);

      // Determine highest role based on hierarchy
      const roleHierarchy: AppRole[] = ['admin', 'manager', 'leader_chef', 'staff'];
      const highest = roleHierarchy.find(role => userRoles.includes(role)) || null;
      setHighestRole(highest);
      setLoading(false);
    };

    fetchUserRoles();

    // Subscribe to role changes
    const subscription = supabase
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUserRoles();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  const isAdmin = hasRole('admin');
  const isManager = hasAnyRole(['admin', 'manager']);
  const isLeaderChef = hasAnyRole(['admin', 'leader_chef']);

  return {
    roles,
    highestRole,
    loading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isLeaderChef,
  };
};
