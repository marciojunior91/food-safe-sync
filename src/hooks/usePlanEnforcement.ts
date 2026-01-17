/**
 * USE PLAN ENFORCEMENT HOOK
 * 
 * Enforces plan limits across the application
 * Shows upgrade modal when limits are reached
 * Provides easy-to-use guards for features
 * 
 * Created: January 14, 2026
 */

import { useState } from 'react';
import { useSubscription } from './useSubscription';
import { UpgradeModal } from '@/components/billing/UpgradeModal';

export function usePlanEnforcement() {
  const { planLimits, hasFeature, canAddTeamMember, canAddRecipe, canAddProduct, canAddSupplier } =
    useSubscription();

  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    limitType: 'teamMembers' | 'recipes' | 'products' | 'suppliers' | 'feature';
    featureName?: string;
  }>({
    open: false,
    limitType: 'teamMembers',
  });

  const checkTeamMemberLimit = (currentCount: number): boolean => {
    const allowed = canAddTeamMember(currentCount);
    if (!allowed) {
      setUpgradeModal({
        open: true,
        limitType: 'teamMembers',
      });
    }
    return allowed;
  };

  const checkRecipeLimit = (currentCount: number): boolean => {
    const allowed = canAddRecipe(currentCount);
    if (!allowed) {
      setUpgradeModal({
        open: true,
        limitType: 'recipes',
      });
    }
    return allowed;
  };

  const checkProductLimit = (currentCount: number): boolean => {
    const allowed = canAddProduct(currentCount);
    if (!allowed) {
      setUpgradeModal({
        open: true,
        limitType: 'products',
      });
    }
    return allowed;
  };

  const checkSupplierLimit = (currentCount: number): boolean => {
    const allowed = canAddSupplier(currentCount);
    if (!allowed) {
      setUpgradeModal({
        open: true,
        limitType: 'suppliers',
      });
    }
    return allowed;
  };

  const checkFeature = (feature: keyof typeof planLimits, featureName: string): boolean => {
    const allowed = hasFeature(feature as any);
    if (!allowed) {
      setUpgradeModal({
        open: true,
        limitType: 'feature',
        featureName,
      });
    }
    return allowed;
  };

  return {
    checkTeamMemberLimit,
    checkRecipeLimit,
    checkProductLimit,
    checkSupplierLimit,
    checkFeature,
    upgradeModalProps: {
      open: upgradeModal.open,
      onOpenChange: (open: boolean) => setUpgradeModal({ ...upgradeModal, open }),
      limitType: upgradeModal.limitType,
      currentPlan: planLimits?.planType || 'free',
      currentLimit:
        upgradeModal.limitType === 'teamMembers'
          ? planLimits?.maxTeamMembers || 1
          : upgradeModal.limitType === 'recipes'
          ? planLimits?.maxRecipes || 10
          : upgradeModal.limitType === 'products'
          ? planLimits?.maxProducts || 20
          : planLimits?.maxSuppliers || 10,
      featureName: upgradeModal.featureName,
    },
  };
}
