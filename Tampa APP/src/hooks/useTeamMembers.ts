import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  TeamMember, 
  CreateTeamMemberInput, 
  UpdateTeamMemberInput,
  TeamMemberFilters,
  TeamMemberRole
} from '@/types/teamMembers';
import { hashPIN, generateRandomPIN } from '@/utils/pinUtils';
import { useToast } from '@/hooks/use-toast';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false); // Changed from true to false
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Fetch team members with optional filters
  const fetchTeamMembers = async (filters?: TeamMemberFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('team_members')
        .select('*')
        .order('display_name', { ascending: true });

      // Apply filters
      if (filters?.role_type && filters.role_type !== 'all') {
        query = query.eq('role_type', filters.role_type);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.organization_id) {
        query = query.eq('organization_id', filters.organization_id);
      }

      if (filters?.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      if (filters?.auth_role_id) {
        query = query.eq('auth_role_id', filters.auth_role_id);
      }

      if (filters?.profile_complete !== undefined) {
        query = query.eq('profile_complete', filters.profile_complete);
      }

      if (filters?.search) {
        query = query.or(`display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,position.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTeamMembers(data || []);
      return data || [];
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error fetching team members',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch single team member by ID
  const fetchTeamMember = async (id: string): Promise<TeamMember | null> => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error fetching team member',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Create new team member
  const createTeamMember = async (input: CreateTeamMemberInput): Promise<TeamMember | null> => {
    try {
      // Generate PIN if not provided
      const pin = input.pin || generateRandomPIN();
      const pin_hash = await hashPIN(pin);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          display_name: input.display_name,
          email: input.email,
          phone: input.phone,
          position: input.position,
          
          // New personal fields
          date_of_birth: input.date_of_birth,
          address: input.address,
          tfn_number: input.tfn_number,
          
          // Emergency contact
          emergency_contact_name: input.emergency_contact_name,
          emergency_contact_phone: input.emergency_contact_phone,
          emergency_contact_relationship: input.emergency_contact_relationship,
          
          // Employment
          hire_date: input.hire_date,
          department_id: input.department_id,
          role_type: input.role_type,
          auth_role_id: input.auth_role_id,
          organization_id: input.organization_id,
          location_id: input.location_id,
          pin_hash,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const teamMember = data;

      toast({
        title: 'Team member created',
        description: `${teamMember.display_name} has been added. PIN: ${pin}`,
      });

      // Refresh list
      await fetchTeamMembers();

      return teamMember;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error creating team member',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update team member
  const updateTeamMember = async (
    id: string, 
    updates: UpdateTeamMemberInput
  ): Promise<TeamMember | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prepare update data
      const updateData: any = {
        ...updates,
        updated_by: user.id,
      };

      // If updating PIN, hash it
      if (updates.pin) {
        updateData.pin_hash = await hashPIN(updates.pin);
        delete updateData.pin;
      }

      const { data, error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const teamMember = data;

      toast({
        title: 'Team member updated',
        description: `${teamMember.display_name} has been updated.`,
      });

      // Refresh list
      await fetchTeamMembers();

      // Check and update profile completion after edit
      setTimeout(async () => {
        await checkProfileCompletion(id);
      }, 500);

      return teamMember;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error updating team member',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Deactivate team member (soft delete)
  const deactivateTeamMember = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Team member deactivated',
        description: 'The team member has been deactivated.',
      });

      // Refresh list
      await fetchTeamMembers();

      return true;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error deactivating team member',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Reactivate team member
  const reactivateTeamMember = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Team member reactivated',
        description: 'The team member has been reactivated.',
      });

      // Refresh list
      await fetchTeamMembers();

      return true;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error reactivating team member',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Verify PIN for team member
  const verifyPIN = async (memberId: string, pin: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('verify_team_member_pin', {
        member_id: memberId,
        pin_input: pin,
      });

      if (error) throw error;

      return data === true;
    } catch (err) {
      const error = err as Error;
      console.error('PIN verification error:', error);
      toast({
        title: 'PIN verification failed',
        description: 'Could not verify PIN. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get team members by role
  const getTeamMembersByRole = async (role: TeamMemberRole): Promise<TeamMember[]> => {
    return fetchTeamMembers({ role_type: role, is_active: true });
  };

  // Get team members by auth account
  const getTeamMembersByAuthRole = async (authRoleId: string): Promise<TeamMember[]> => {
    return fetchTeamMembers({ auth_role_id: authRoleId, is_active: true });
  };

  // Get incomplete profiles
  const getIncompleteProfiles = async (): Promise<TeamMember[]> => {
    return fetchTeamMembers({ profile_complete: false, is_active: true });
  };

  /**
   * Check if team member profile is complete and update flag
   * This is called after editing to verify if all requirements are met
   */
  const checkProfileCompletion = async (memberId: string): Promise<void> => {
    try {
      // Fetch team member data
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Check if all required fields are filled
      const requiredFields = {
        display_name: member.display_name,
        email: member.email,
        phone: member.phone,
        position: member.position,
        hire_date: member.hire_date,
      };

      const optionalButImportant = {
        date_of_birth: member.date_of_birth,
        address: member.address,
        emergency_contact_name: member.emergency_contact_name,
        emergency_contact_phone: member.emergency_contact_phone,
      };

      // Profile is complete if all required fields are filled
      // and at least some important fields
      const allRequiredFilled = Object.values(requiredFields).every(field => field);
      const optionalFilledCount = Object.values(optionalButImportant).filter(field => field).length;
      const someOptionalFilled = optionalFilledCount >= 2;
      
      // Check if there are any active certificates
      const { data: certs, error: certsError } = await supabase
        .from('team_member_certificates')
        .select('id')
        .eq('team_member_id', memberId)
        .eq('status', 'active');

      if (certsError) throw certsError;

      const hasCertificates = certs && certs.length > 0;

      // Debug logging
      console.log(`[Profile Completion Check] Member: ${member.display_name}`);
      console.log('Required fields:', {
        allFilled: allRequiredFilled,
        fields: Object.entries(requiredFields).map(([key, val]) => ({ [key]: !!val }))
      });
      console.log('Optional fields:', {
        filled: optionalFilledCount,
        needed: 2,
        fields: Object.entries(optionalButImportant).map(([key, val]) => ({ [key]: !!val }))
      });
      console.log('Certificates:', { count: certs?.length || 0, hasActive: hasCertificates });

      // Profile is complete if:
      // 1. All required fields filled
      // 2. Some optional fields filled (at least 2)
      // 3. At least one certificate uploaded
      const isComplete = allRequiredFilled && someOptionalFilled && hasCertificates;

      console.log('Completion result:', {
        isComplete,
        currentFlag: member.profile_complete,
        willUpdate: member.profile_complete !== isComplete
      });

      // Update profile_complete flag if changed
      if (member.profile_complete !== isComplete) {
        const { error: updateError } = await supabase
          .from('team_members')
          .update({ profile_complete: isComplete })
          .eq('id', memberId);

        if (updateError) throw updateError;

        console.log(`✅ Profile completion updated for ${memberId}: ${isComplete}`);
        
        // Show toast notification
        toast({
          title: isComplete ? '🎉 Profile Complete!' : 'Profile Updated',
          description: isComplete 
            ? 'All required information has been provided.' 
            : 'Profile completion status updated.',
        });

        // Refresh the list to show updated status
        await fetchTeamMembers();
      } else {
        console.log(`ℹ️ Profile completion unchanged: ${isComplete}`);
      }
    } catch (error) {
      console.error('[useTeamMembers] Error checking profile completion:', error);
      // Don't throw - this is a background check
    }
  };

  // NOTE: No initial load here - let the component decide when to fetch
  // This allows proper organization_id filtering

  return {
    teamMembers,
    loading,
    error,
    fetchTeamMembers,
    fetchTeamMember,
    createTeamMember,
    updateTeamMember,
    deactivateTeamMember,
    reactivateTeamMember,
    verifyPIN,
    getTeamMembersByRole,
    getTeamMembersByAuthRole,
    getIncompleteProfiles,
  };
};
