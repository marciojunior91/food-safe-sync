import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  UserProfile,
  UserDocument,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  UserRole,
  EmploymentStatus,
} from '@/types/people';

/**
 * Hook for managing people/users
 * Provides CRUD operations, filtering, and user profile management
 */
export function usePeople(organizationId?: string) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch users with optional filters
  const fetchUsers = useCallback(async (filters?: UserFilters) => {
    try {
      setLoading(true);
      setError(null);

      // First, get profiles with documents
      let query = supabase
        .from('profiles')
        .select('*, user_documents:user_documents(*)')
        .order('display_name');

      // Apply organization filter if provided
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      // Apply additional filters (except role, which we'll filter after fetching)
      if (filters) {
        if (filters.department_id) {
          query = query.eq('department_id', filters.department_id);
        }
        if (filters.search) {
          // Only search by text fields to avoid UUID parse errors
          query = query.or(
            `display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
          );
        }
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Then, get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user_id to role
      const rolesMap = new Map(
        (rolesData || []).map((r: any) => [r.user_id, r.role])
      );

      // Merge profiles with roles
      let transformedData = (profilesData || []).map((user: any) => ({
        ...user,
        role: rolesMap.get(user.user_id) || 'staff',
      }));

      // Apply role filter if specified
      if (filters?.role && filters.role !== 'all') {
        transformedData = transformedData.filter((user) => user.role === filters.role);
      }

      setUsers(transformedData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Create a new user
  const createUser = async (input: CreateUserInput): Promise<UserProfile | null> => {
    try {
      const { data, error: createError } = await supabase
        .from('profiles')
        .insert({
          ...input,
          organization_id: organizationId
        } as any)
        .select(`
          *,
          user_documents:user_documents(*)
        `)
        .single();

      if (createError) throw createError;

      // Update local state
      if (data) {
        setUsers(prev => [...prev, data as any]);
      }

      return data as any;
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err as Error);
      return null;
    }
  };

  // Update an existing user
  const updateUser = async (
    userId: string,
    updates: UpdateUserInput
  ): Promise<boolean> => {
    try {
      // Separate role updates from profile updates
      const { role, ...profileUpdates } = updates as any;

      // Update profile fields (everything except role)
      if (Object.keys(profileUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }

      // Update role in user_roles table if provided
      if (role) {
        // First check if user has a role entry
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingRole) {
          // Update existing role
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role })
            .eq('user_id', userId);

          if (roleError) throw roleError;
        } else {
          // Insert new role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role });

          if (roleError) throw roleError;
        }
      }

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.user_id === userId ? { ...user, ...updates } : user
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err as Error);
      return false;
    }
  };

  // Delete a user (soft delete by setting employment_status to terminated)
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          employment_status: 'terminated' as EmploymentStatus,
          terminated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.user_id === userId
            ? { 
                ...user, 
                employment_status: 'terminated' as EmploymentStatus,
                terminated_at: new Date().toISOString()
              }
            : user
        )
      );

      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err as Error);
      return false;
    }
  };

  // Upload user document
  const uploadDocument = async (
    userId: string,
    file: File,
    documentType: string
  ): Promise<UserDocument | null> => {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `user-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error: createError } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          document_type: documentType,
          document_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          status: 'active'
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.user_id === userId
            ? {
                ...user,
                user_documents: [...(user.user_documents || []), data as any]
              }
            : user
        )
      );

      return data as any;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err as Error);
      return null;
    }
  };

  // Delete user document
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      // Get document info
      const { data: doc, error: fetchError } = await supabase
        .from('user_documents')
        .select('file_url, user_id')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Note: file deletion from storage would need the file path, skipping for now

      // Delete document record
      const { error: deleteError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.user_id === doc.user_id
            ? {
                ...user,
                user_documents: user.user_documents?.filter(d => d.id !== documentId)
              }
            : user
        )
      );

      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err as Error);
      return false;
    }
  };

  // Get users by role
  const getUsersByRole = (role: UserRole) => {
    return users.filter(user => user.role === role);
  };

  // Get active users
  const getActiveUsers = () => {
    return users.filter(user => user.employment_status === 'active');
  };

  // Get users by department
  const getUsersByDepartment = (departmentId: string) => {
    return users.filter(user => user.department_id === departmentId);
  };

  // Verify user PIN
  const verifyPin = async (userId: string, pin: string): Promise<boolean> => {
    // TODO: Implement PIN verification RPC function in database
    console.warn('PIN verification not yet implemented');
    return false;
  };

  // Set user PIN
  const setPin = async (userId: string, pin: string): Promise<boolean> => {
    // TODO: Implement PIN setting RPC function in database
    console.warn('PIN setting not yet implemented');
    return false;
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (profile: Partial<UserProfile>): number => {
    const fields = [
      'display_name',
      'email',
      'phone',
      'avatar_url',
      'bio',
      'role',
      'department_id'
    ];

    const completed = fields.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value !== null && value !== undefined && value !== '';
    }).length;

    return Math.round((completed / fields.length) * 100);
  };

  // Get profile completion for a user
  const getProfileCompletion = (userId: string): number => {
    const user = users.find(u => u.user_id === userId);
    return user?.profile_completion_percentage || 0;
  };

  // Initial fetch
  useEffect(() => {
    if (organizationId) {
      fetchUsers();
    }
  }, [organizationId, fetchUsers]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`people:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [...prev, payload.new as any]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev =>
              prev.map(user =>
                user.user_id === payload.new.user_id
                  ? { ...user, ...payload.new }
                  : user
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(user => user.user_id !== payload.old.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  return {
    users,
    loading,
    error,
    // CRUD operations
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    // Document management
    uploadDocument,
    deleteDocument,
    // Helper functions
    getUsersByRole,
    getActiveUsers,
    getUsersByDepartment,
    getProfileCompletion,
    // PIN management
    verifyPin,
    setPin,
    // Refresh
    refresh: fetchUsers
  };
}
