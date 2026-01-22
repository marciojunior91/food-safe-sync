/**
 * STRIPE INTEGRATION
 * 
 * Handles all Stripe-related functionality:
 * - Client initialization
 * - Checkout session creation
 * - Subscription management
 * - Webhook handling
 * 
 * Created: January 14, 2026
 * Updated: January 20, 2026 - Added feature flag support
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { FEATURES } from './featureFlags';

// =====================================================
// CONFIGURATION
// =====================================================

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Feature flag check
if (!FEATURES.STRIPE_ENABLED) {
  console.info('ℹ️ Stripe is DISABLED via feature flag. MVP mode: manual org/user creation.');
} else if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ Stripe is ENABLED but publishable key not configured. Payment features will fail.');
}

// Singleton instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or create Stripe instance
 * Returns null if Stripe is disabled via feature flag
 */
export const getStripe = () => {
  // Feature flag check
  if (!FEATURES.STRIPE_ENABLED) {
    return null;
  }
  
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// =====================================================
// SUBSCRIPTION PLANS
// =====================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // Monthly price in AUD
  currency: string;
  stripePriceId: string; // Stripe Price ID (price_...)
  features: string[];
  maxUsers: number;
  maxLocations: number;
  popular?: boolean;
  cta: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small restaurants getting started',
    price: 49,
    currency: 'AUD',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || 'price_starter_monthly',
    features: [
      'Up to 10 team members',
      'Single location',
      'Smart label printing',
      'Recipe management',
      'Basic routine tasks',
      'Expiry tracking',
      'Email support',
    ],
    maxUsers: 10,
    maxLocations: 1,
    cta: 'Start Free Trial',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing restaurants with multiple teams',
    price: 99,
    currency: 'AUD',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
    features: [
      'Up to 50 team members',
      'Up to 3 locations',
      'Everything in Starter',
      'Team communication feed',
      'Knowledge base',
      'Training center',
      'Advanced task templates',
      'Priority email support',
    ],
    maxUsers: 50,
    maxLocations: 3,
    popular: true,
    cta: 'Start Free Trial',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For restaurant groups and franchises',
    price: 299,
    currency: 'AUD',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
    features: [
      'Unlimited team members',
      'Unlimited locations',
      'Everything in Professional',
      'Multi-location management',
      'API access',
      'Custom integrations',
      'Advanced analytics',
      'Dedicated account manager',
      '24/7 priority support',
    ],
    maxUsers: 999999,
    maxLocations: 999999,
    cta: 'Contact Sales',
  },
};

// =====================================================
// CHECKOUT
// =====================================================

export interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  trialDays?: number;
}

/**
 * Create a Stripe Checkout session
 * This redirects the user to Stripe's hosted payment page
 * Subscription is linked to the authenticated user
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const {
    priceId,
    successUrl = `${window.location.origin}/onboarding?subscription=success`,
    cancelUrl = `${window.location.origin}/pricing?canceled=true`,
    trialDays = 14,
  } = params;

  try {
    // Get Supabase URL and auth token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated. Please log in.');
    }

    // Call Supabase Edge Function to create the session
    // NOTE: organizationId is NOT required - subscription links to user first
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl,
        cancelUrl,
        trialDays,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();

    if (!url) {
      throw new Error('No checkout URL returned from server');
    }

    // Redirect to Stripe Checkout using the URL
    // This is the modern way - no need for stripe.redirectToCheckout()
    window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

/**
 * Start checkout flow for a specific plan
 * User must be authenticated - subscription links to user automatically
 */
export async function startCheckout(planId: string) {
  // Feature Flag: Guard against payments when Stripe disabled
  if (!FEATURES.STRIPE_ENABLED) {
    console.info('[MVP] Stripe payments disabled - blocking checkout');
    throw new Error('Payments are currently disabled. Please contact support to activate your subscription.');
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  if (plan.id === 'enterprise') {
    // Enterprise requires contacting sales
    window.location.href = '/contact-sales';
    return;
  }

  await createCheckoutSession({
    priceId: plan.stripePriceId,
    trialDays: 14,
  });
}

// =====================================================
// SUBSCRIPTION MANAGEMENT
// =====================================================

export interface Subscription {
  id: string;
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planType: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch current organization subscription
 */
export async function getSubscription(organizationId: string): Promise<Subscription | null> {
  try {
    const response = await fetch(`/api/subscriptions/${organizationId}`);
    
    if (response.status === 404) {
      return null; // No subscription
    }

    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(organizationId: string) {
  try {
    const response = await fetch(`/api/subscriptions/${organizationId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(organizationId: string) {
  try {
    const response = await fetch(`/api/subscriptions/${organizationId}/reactivate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reactivate subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Open Stripe Customer Portal
 * Allows users to manage billing, payment methods, and invoices
 */
export async function openCustomerPortal(organizationId: string) {
  try {
    const response = await fetch(`/api/stripe/customer-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ organizationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to open customer portal');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error opening customer portal:', error);
    throw error;
  }
}

// =====================================================
// BILLING HISTORY
// =====================================================

export interface BillingHistoryItem {
  id: string;
  organizationId: string;
  stripeInvoiceId: string;
  amount: number; // in cents
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  invoiceDate: string;
  paidAt?: string;
  lineItems?: any[];
}

/**
 * Fetch billing history for organization
 */
export async function getBillingHistory(organizationId: string): Promise<BillingHistoryItem[]> {
  try {
    const response = await fetch(`/api/billing/${organizationId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch billing history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}

// =====================================================
// UTILITIES
// =====================================================

/**
 * Format amount from cents to currency string
 */
export function formatAmount(cents: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Get plan by ID
 */
export function getPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Check if subscription is in trial
 */
export function isSubscriptionTrialing(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === 'trialing';
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: Subscription | null): number | null {
  if (!subscription || !subscription.trialEnd) return null;
  
  const trialEnd = new Date(subscription.trialEnd);
  const now = new Date();
  const diff = trialEnd.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return days > 0 ? days : 0;
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: Subscription['status']): string {
  const statusMap: Record<Subscription['status'], string> = {
    active: 'Active',
    trialing: 'Trial',
    canceled: 'Canceled',
    past_due: 'Past Due',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    unpaid: 'Unpaid',
  };
  
  return statusMap[status] || status;
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  getStripe,
  SUBSCRIPTION_PLANS,
  createCheckoutSession,
  startCheckout,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  openCustomerPortal,
  getBillingHistory,
  formatAmount,
  getPlan,
  isSubscriptionActive,
  isSubscriptionTrialing,
  getTrialDaysRemaining,
  formatSubscriptionStatus,
};
