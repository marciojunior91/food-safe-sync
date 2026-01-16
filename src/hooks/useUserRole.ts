// ============================================================================
// useUserRole Hook - Check Current User's System Role
// ============================================================================
// This hook fetches and manages the current authenticated user's role from
// the user_roles table (Layer 1: System Access)
//
// Roles Hierarchy:
// - admin: Full system access
// - manager: Manage team members and tasks
// - leader_chef: Create team members and assign tasks
// - staff: Limited access, requires PIN for profile edits
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'manager' | 'leader_chef' | 'staff';

interface UseUserRoleReturn {
  role: AppRole | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isManager: boolean;
  isLeaderChef: boolean;
  isStaff: boolean;
  canManageTeamMembers: boolean;
  canEditWithoutPIN: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to get the current user's role from user_roles table
 * 
 * Usage:
 * ```tsx
 * const { role, isAdmin, canEditWithoutPIN } = useUserRole();
 * 
 * if (canEditWithoutPIN) {
 *   // Admin/Manager can edit without PIN
 * } else {
 *   // Staff needs PIN validation
 * }
 * ```
 */
export const useUserRole = (): UseUserRoleReturn => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('[useUserRole] Fetching role for user:', user.id);

      // Fetch user's role (highest priority if multiple)
      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true }) // admin < manager < leader_chef < staff
        .limit(1)
        .maybeSingle();

      if (roleError) {
        throw new Error(`Failed to fetch user role: ${roleError.message}`);
      }

      if (!data) {
        console.warn('[useUserRole] No role found for user. Defaulting to staff.');
        setRole('staff');
        return;
      }

      console.log('[useUserRole] User role:', data.role);
      setRole(data.role as AppRole);
    } catch (err) {
      const error = err as Error;
      console.error('[useUserRole] Error fetching user role:', error);
      setError(error);
      toast({
        title: 'Error loading user role',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUserRole();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserRole();
      } else {
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Derived state - role checks
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isLeaderChef = role === 'leader_chef';
  const isStaff = role === 'staff';

  // Permission checks
  const canManageTeamMembers = role === 'admin' || role === 'manager' || role === 'leader_chef';
  const canEditWithoutPIN = role === 'admin' || role === 'manager';

  return {
    role,
    loading,
    error,
    isAdmin,
    isManager,
    isLeaderChef,
    isStaff,
    canManageTeamMembers,
    canEditWithoutPIN,
    refetch: fetchUserRole,
  };
};

/**
 * Utility function to check if user has a specific role or higher
 */
export const hasRoleOrHigher = (userRole: AppRole | null, requiredRole: AppRole): boolean => {
  if (!userRole) return false;

  const hierarchy: AppRole[] = ['admin', 'manager', 'leader_chef', 'staff'];
  const userIndex = hierarchy.indexOf(userRole);
  const requiredIndex = hierarchy.indexOf(requiredRole);

  return userIndex <= requiredIndex;
};
