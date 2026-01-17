/**
 * USE SUBSCRIPTION HOOK
 * 
 * React hook for managing subscription state
 * Uses SQL functions from user-first subscription model
 * Provides plan limits, feature checks, and subscription management
 * 
 * Updated: January 14, 2026 - User-First Subscription Model
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// RPC Response Types
interface SubscriptionRPCResponse {
  id: string;
  plan_type: 'starter' | 'professional' | 'enterprise' | 'free';
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  trial_end: string | null;
  current_period_end: string | null;
  organization_id: string | null;
  has_organization: boolean;
}

interface PlanLimitsRPCResponse {
  plan_type: string;
  max_team_members: number;
  max_recipes: number;
  max_products: number;
  max_suppliers: number;
  has_allergen_management: boolean;
  has_nutritional_calculator: boolean;
  has_cost_control: boolean;
  has_api_access: boolean;
  has_priority_support: boolean;
}

export interface SubscriptionData {
  id: string;
  planType: 'starter' | 'professional' | 'enterprise' | 'free';
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  organizationId: string | null;
  hasOrganization: boolean;
}

export interface PlanLimits {
  planType: string;
  maxTeamMembers: number;
  maxRecipes: number;
  maxProducts: number;
  maxSuppliers: number;
  hasAllergenManagement: boolean;
  hasNutritionalCalculator: boolean;
  hasCostControl: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's subscription using SQL function
      const { data: subDataRaw, error: subError } = await supabase
        .rpc('get_user_subscription' as any, { p_user_id: user.id })
        .maybeSingle();
      
      const subData = subDataRaw as SubscriptionRPCResponse | null;

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Fetch plan limits using SQL function
      const { data: limitsDataRaw, error: limitsError } = await supabase
        .rpc('get_user_plan_limits' as any, { p_user_id: user.id })
        .single();
      
      const limitsData = limitsDataRaw as PlanLimitsRPCResponse | null;

      if (limitsError) {
        console.warn('Failed to fetch plan limits:', limitsError);
        // Use free plan limits as fallback
        setPlanLimits({
          planType: 'free',
          maxTeamMembers: 1,
          maxRecipes: 10,
          maxProducts: 20,
          maxSuppliers: 10,
          hasAllergenManagement: false,
          hasNutritionalCalculator: false,
          hasCostControl: false,
          hasApiAccess: false,
          hasPrioritySupport: false,
        });
      } else if (limitsData) {
        setPlanLimits({
          planType: limitsData.plan_type,
          maxTeamMembers: limitsData.max_team_members,
          maxRecipes: limitsData.max_recipes,
          maxProducts: limitsData.max_products,
          maxSuppliers: limitsData.max_suppliers,
          hasAllergenManagement: limitsData.has_allergen_management,
          hasNutritionalCalculator: limitsData.has_nutritional_calculator,
          hasCostControl: limitsData.has_cost_control,
          hasApiAccess: limitsData.has_api_access,
          hasPrioritySupport: limitsData.has_priority_support,
        });
      }

      if (subData) {
        setSubscription({
          id: subData.id,
          planType: subData.plan_type,
          status: subData.status,
          trialEnd: subData.trial_end,
          currentPeriodEnd: subData.current_period_end,
          organizationId: subData.organization_id,
          hasOrganization: subData.has_organization,
        });
      } else {
        // No subscription found - user is on free plan
        setSubscription(null);
      }
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message || 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user?.id]);

  // Computed properties
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrialing = subscription?.status === 'trialing';
  const isFree = !subscription || planLimits?.planType === 'free';

  const trialDaysRemaining = isTrialing && subscription?.trialEnd
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const daysUntilRenewal = isActive && subscription?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Helper functions
  const hasFeature = (feature: keyof PlanLimits): boolean => {
    if (!planLimits) return false;
    const value = planLimits[feature];
    return typeof value === 'boolean' ? value : false;
  };

  const canAddTeamMember = (currentCount: number): boolean => {
    if (!planLimits) return false;
    return planLimits.maxTeamMembers === -1 || currentCount < planLimits.maxTeamMembers;
  };

  const canAddRecipe = (currentCount: number): boolean => {
    if (!planLimits) return false;
    return planLimits.maxRecipes === -1 || currentCount < planLimits.maxRecipes;
  };

  const canAddProduct = (currentCount: number): boolean => {
    if (!planLimits) return false;
    return planLimits.maxProducts === -1 || currentCount < planLimits.maxProducts;
  };

  const canAddSupplier = (currentCount: number): boolean => {
    if (!planLimits) return false;
    return planLimits.maxSuppliers === -1 || currentCount < planLimits.maxSuppliers;
  };

  return {
    subscription,
    planLimits,
    loading,
    error,
    isActive,
    isTrialing,
    isFree,
    trialDaysRemaining,
    daysUntilRenewal,
    refetch: fetchSubscription,
    hasFeature,
    canAddTeamMember,
    canAddRecipe,
    canAddProduct,
    canAddSupplier,
  };
}
