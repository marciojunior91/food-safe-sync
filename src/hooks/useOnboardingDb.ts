// React Hook for Onboarding Database Operations
// Iteration 13 - MVP Sprint
// Provides a clean interface for UI components to interact with onboarding DB operations

import { useState, useCallback } from 'react';
import {
  registerUser,
  createOrganization,
  importProducts,
  createTeamMembers,
  sendUserInvitations,
  completeOnboarding,
} from '@/lib/onboardingDb';
import {
  RegistrationData,
  CompanyData,
  ProductImportData,
  TeamMembersData,
  InviteUsersData,
} from '@/types/onboarding';

interface OnboardingState {
  loading: boolean;
  error: string | null;
  userId: string | null;
  organizationId: string | null;
  success: boolean;
}

export function useOnboardingDb() {
  const [state, setState] = useState<OnboardingState>({
    loading: false,
    error: null,
    userId: null,
    organizationId: null,
    success: false,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  const setSuccess = (userId: string, organizationId: string) => {
    setState(prev => ({
      ...prev,
      success: true,
      userId,
      organizationId,
      loading: false,
      error: null,
    }));
  };

  // Complete entire onboarding flow
  const submitOnboarding = useCallback(
    async (
      registrationData: RegistrationData,
      companyData: CompanyData,
      productsData: ProductImportData,
      teamMembersData: TeamMembersData,
      inviteUsersData: InviteUsersData
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await completeOnboarding(
          registrationData,
          companyData,
          productsData,
          teamMembersData,
          inviteUsersData
        );

        if (!result.success) {
          throw new Error(result.error || 'Onboarding failed');
        }

        setSuccess(result.userId!, result.organizationId!);

        return {
          success: true,
          userId: result.userId,
          organizationId: result.organizationId,
          productsImported: result.productsImported,
          teamMembersCreated: result.teamMembersCreated,
          invitationsSent: result.invitationsSent,
        };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to complete onboarding';
        setError(errorMessage);
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Individual step functions (for step-by-step submission if needed)
  
  const submitRegistration = useCallback(async (data: RegistrationData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await registerUser(data);
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      setState(prev => ({
        ...prev,
        userId: result.userId!,
        loading: false,
      }));

      return { success: true, userId: result.userId };
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const submitCompanyInfo = useCallback(
    async (data: CompanyData, userId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await createOrganization(data, userId);
        
        if (!result.success) {
          throw new Error(result.error || 'Company creation failed');
        }

        setState(prev => ({
          ...prev,
          organizationId: result.organizationId!,
          loading: false,
        }));

        return { success: true, organizationId: result.organizationId };
      } catch (error: any) {
        const errorMessage = error.message || 'Company creation failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const submitProducts = useCallback(
    async (data: ProductImportData, organizationId: string, userId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await importProducts(data, organizationId, userId);
        
        setState(prev => ({ ...prev, loading: false }));

        return {
          success: result.success,
          imported: result.imported,
          error: result.error,
        };
      } catch (error: any) {
        const errorMessage = error.message || 'Product import failed';
        setError(errorMessage);
        return { success: false, error: errorMessage, imported: 0 };
      }
    },
    []
  );

  const submitTeamMembers = useCallback(
    async (data: TeamMembersData, organizationId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await createTeamMembers(data, organizationId);
        
        setState(prev => ({ ...prev, loading: false }));

        return {
          success: result.success,
          created: result.created,
          error: result.error,
        };
      } catch (error: any) {
        const errorMessage = error.message || 'Team member creation failed';
        setError(errorMessage);
        return { success: false, error: errorMessage, created: 0 };
      }
    },
    []
  );

  const submitInvitations = useCallback(
    async (data: InviteUsersData, organizationId: string, userId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await sendUserInvitations(data, organizationId, userId);
        
        setState(prev => ({ ...prev, loading: false }));

        return {
          success: result.success,
          sent: result.sent,
          failed: result.failed,
          error: result.error,
        };
      } catch (error: any) {
        const errorMessage = error.message || 'Invitation sending failed';
        setError(errorMessage);
        return { success: false, error: errorMessage, sent: 0 };
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      userId: null,
      organizationId: null,
      success: false,
    });
  }, []);

  return {
    // State
    loading: state.loading,
    error: state.error,
    userId: state.userId,
    organizationId: state.organizationId,
    success: state.success,

    // Complete flow
    submitOnboarding,

    // Individual steps
    submitRegistration,
    submitCompanyInfo,
    submitProducts,
    submitTeamMembers,
    submitInvitations,

    // Utilities
    clearError,
    resetState,
  };
}
