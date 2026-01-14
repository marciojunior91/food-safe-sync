/**
 * USE SUBSCRIPTION HOOK
 * 
 * React hook for managing subscription state
 * Fetches subscription data, billing history, and provides actions
 * 
 * Created: January 14, 2026
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  getSubscription,
  getBillingHistory,
  cancelSubscription as cancelSubscriptionAPI,
  reactivateSubscription as reactivateSubscriptionAPI,
  openCustomerPortal,
  type Subscription,
  type BillingHistoryItem,
} from '@/lib/stripe';
import { toast } from 'sonner';

export function useSubscription() {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get organization ID from user profile
  useEffect(() => {
    async function fetchOrganizationId() {
      if (!user?.id) {
        setOrganizationId(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setOrganizationId(data?.organization_id || null);
      } catch (err) {
        console.error('Error fetching organization ID:', err);
        setOrganizationId(null);
      }
    }

    fetchOrganizationId();
  }, [user?.id]);

  // Fetch subscription data
  useEffect(() => {
    async function fetchData() {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [subData, billingData] = await Promise.all([
          getSubscription(organizationId),
          getBillingHistory(organizationId),
        ]);

        setSubscription(subData);
        setBillingHistory(billingData);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [organizationId]);

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!organizationId) {
      toast.error('Organization not found');
      return;
    }

    try {
      const result = await cancelSubscriptionAPI(organizationId);
      setSubscription(result);
      toast.success('Subscription will be canceled at the end of the billing period');
    } catch (err) {
      console.error('Error canceling subscription:', err);
      toast.error('Failed to cancel subscription. Please try again.');
      throw err;
    }
  };

  // Reactivate subscription
  const reactivateSubscription = async () => {
    if (!organizationId) {
      toast.error('Organization not found');
      return;
    }

    try {
      const result = await reactivateSubscriptionAPI(organizationId);
      setSubscription(result);
      toast.success('Subscription reactivated successfully');
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      toast.error('Failed to reactivate subscription. Please try again.');
      throw err;
    }
  };

  // Open billing portal
  const manageBilling = async () => {
    if (!organizationId) {
      toast.error('Organization not found');
      return;
    }

    try {
      await openCustomerPortal(organizationId);
    } catch (err) {
      console.error('Error opening billing portal:', err);
      toast.error('Failed to open billing portal. Please try again.');
      throw err;
    }
  };

  // Refresh subscription data
  const refresh = async () => {
    if (!organizationId) return;

    try {
      const [subData, billingData] = await Promise.all([
        getSubscription(organizationId),
        getBillingHistory(organizationId),
      ]);

      setSubscription(subData);
      setBillingHistory(billingData);
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      toast.error('Failed to refresh subscription data');
    }
  };

  return {
    subscription,
    billingHistory,
    loading,
    error,
    cancelSubscription,
    reactivateSubscription,
    manageBilling,
    refresh,
  };
}
