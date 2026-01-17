/**
 * SUBSCRIPTION PLANS COMPONENT
 * 
 * Displays available subscription plans with pricing
 * Handles checkout initiation
 * 
 * Created: January 14, 2026
 */

import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS, startCheckout } from '@/lib/stripe';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlansProps {
  organizationId?: string;
  onPlanSelected?: (planId: string) => void;
}

export function SubscriptionPlans({ organizationId: propOrgId, onPlanSelected }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(propOrgId || null);
  const { user } = useAuth();

  // Get organization ID from user profile if not provided
  useEffect(() => {
    if (propOrgId) return;

    async function fetchOrganizationId() {
      if (!user?.id) return;

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
      }
    }

    fetchOrganizationId();
  }, [user?.id, propOrgId]);

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoading(planId);
      
      // Callback for parent component (e.g., onboarding flow)
      if (onPlanSelected) {
        onPlanSelected(planId);
        return;
      }

      // Start Stripe checkout (no organizationId needed - uses userId from auth)
      await startCheckout(planId);
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start with a 14-day free trial. No credit card required.
          Cancel anytime.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex flex-col ${
              plan.popular
                ? 'border-primary shadow-lg scale-105 z-10'
                : 'border-border'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground shadow-md px-4 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-sm mt-2">
                {plan.description}
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    /{plan.currency}/mo
                  </span>
                </div>
                
                {plan.id !== 'enterprise' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    14-day free trial included
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              {/* Features List */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-6">
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading !== null}
                className={`w-full ${
                  plan.popular
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-secondary hover:bg-secondary/90'
                }`}
                size="lg"
              >
                {loading === plan.id ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Loading...
                  </span>
                ) : (
                  plan.cta
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">What happens after the trial?</h3>
            <p className="text-sm text-muted-foreground">
              After your 14-day free trial, you'll be charged monthly based on your selected plan.
              You can cancel anytime before the trial ends without being charged.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Can I change plans later?</h3>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time from the billing settings.
              Changes take effect at the start of your next billing cycle.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards (Visa, Mastercard, American Express) and bank transfers
              through our secure payment processor, Stripe.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Is my data secure?</h3>
            <p className="text-sm text-muted-foreground">
              Absolutely. We use industry-standard encryption and security practices. All payment
              information is processed securely through Stripe - we never store your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
