import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserContext, Organization, Department } from '@/types/organization';

/**
 * Hook to get the current user's organization and department context
 * This provides information about which organization and location the user belongs to
 */
export function useUserContext() {
  const [context, setContext] = useState<UserContext | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUserContext();
  }, []);

  const fetchUserContext = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Fetch user context using the database function
      const { data: contextData, error: contextError } = await supabase
        .rpc('get_current_user_context');

      if (contextError) throw contextError;

      if (contextData && Array.isArray(contextData) && contextData.length > 0) {
        const userContext = contextData[0] as UserContext;
        setContext(userContext);

        // Fetch full organization details
        if (userContext.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userContext.organization_id)
            .single();

          if (!orgError && orgData) {
            setOrganization(orgData as Organization);
          }
        }

        // Fetch full department details
        if (userContext.department_id) {
          const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .select('*')
            .eq('id', userContext.department_id)
            .single();

          if (!deptError && deptData) {
            setDepartment(deptData as Department);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user context:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchUserContext();
  };

  return {
    context,
    organization,
    department,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook to get the current user's organization ID
 * Useful for filtering queries by organization
 */
export function useOrganizationId() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

          if (profile?.organization_id) {
            setOrganizationId(profile.organization_id);
          }
        }
      } catch (error) {
        console.error('Error fetching organization ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationId();
  }, []);

  return { organizationId, loading };
}

/**
 * Hook to get the current user's department ID
 * Useful for filtering queries by department/location
 */
export function useDepartmentId() {
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('location_id')
            .eq('user_id', user.id)
            .single();

          if (profile?.location_id) {
            setDepartmentId(profile.location_id);
          }
        }
      } catch (error) {
        console.error('Error fetching department ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentId();
  }, []);

  return { departmentId, loading };
}

/**
 * Hook to fetch all departments in the user's organization
 */
export function useDepartments() {
  const { organizationId } = useOrganizationId();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('organization_id', organizationId)
          .order('name');

        if (error) throw error;
        setDepartments((data as Department[]) || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [organizationId]);

  return { departments, loading };
}
