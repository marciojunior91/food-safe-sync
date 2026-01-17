/**
 * BILLING PAGE
 * 
 * Manage subscription, view billing history, and update payment methods
 * Integrates with Stripe Customer Portal for secure payment management
 * 
 * Created: January 14, 2026
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Crown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Zap,
  Rocket,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function Billing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    subscription,
    planLimits,
    loading,
    isActive,
    isTrialing,
    isFree,
    trialDaysRemaining,
    daysUntilRenewal,
  } = useSubscription();

  const [loadingPortal, setLoadingPortal] = useState(false);

  const getPlanIcon = () => {
    switch (planLimits?.planType) {
      case 'starter':
        return <Zap className="h-6 w-6 text-blue-500" />;
      case 'professional':
        return <Crown className="h-6 w-6 text-purple-500" />;
      case 'enterprise':
        return <Rocket className="h-6 w-6 text-orange-500" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleManageBilling = async () => {
    if (!subscription?.id) {
      toast({
        title: "No Subscription",
        description: "You don't have an active subscription to manage.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingPortal(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get subscription's stripe_customer_id directly from SQL function
      const { data: subDataRaw, error: subError } = await supabase
        .rpc('get_user_subscription' as any, { p_user_id: user.id })
        .single();
      
      const subFullData = subDataRaw as any;

      if (subError || !subFullData?.stripe_customer_id) {
        throw new Error('No Stripe customer found');
      }

      // Call Edge Function to create portal session
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          customerId: subFullData.stripe_customer_id,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and payment methods
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlanIcon()}
                <div>
                  <CardTitle className="text-2xl capitalize">
                    {planLimits?.planType || 'Free'} Plan
                  </CardTitle>
                  <CardDescription>
                    {isFree && 'Start your free trial today'}
                    {isTrialing && `Trial ends in ${trialDaysRemaining} days`}
                    {isActive && !isTrialing && `Renews in ${daysUntilRenewal} days`}
                  </CardDescription>
                </div>
              </div>

              {/* Status Badge */}
              {isTrialing && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Trial Active
                </Badge>
              )}
              {isActive && !isTrialing && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              {subscription?.status === 'past_due' && (
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Past Due
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Trial Warning */}
            {isTrialing && trialDaysRemaining !== null && trialDaysRemaining <= 3 && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">
                    Your trial is ending soon
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Add a payment method to continue using {planLimits?.planType} features after your trial ends.
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Plan Features & Limits */}
            <div>
              <h3 className="font-semibold mb-3">Plan Limits</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Team Members</p>
                  <p className="text-lg font-semibold">
                    {planLimits?.maxTeamMembers === -1 ? '∞' : planLimits?.maxTeamMembers}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Recipes</p>
                  <p className="text-lg font-semibold">
                    {planLimits?.maxRecipes === -1 ? '∞' : planLimits?.maxRecipes}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Products</p>
                  <p className="text-lg font-semibold">
                    {planLimits?.maxProducts === -1 ? '∞' : planLimits?.maxProducts}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Suppliers</p>
                  <p className="text-lg font-semibold">
                    {planLimits?.maxSuppliers === -1 ? '∞' : planLimits?.maxSuppliers}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Premium Features */}
            {planLimits && (
              <div>
                <h3 className="font-semibold mb-3">Premium Features</h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    {planLimits.hasAllergenManagement ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={planLimits.hasAllergenManagement ? '' : 'text-muted-foreground'}>
                      Allergen Management
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {planLimits.hasNutritionalCalculator ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={planLimits.hasNutritionalCalculator ? '' : 'text-muted-foreground'}>
                      Nutritional Calculator
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {planLimits.hasCostControl ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={planLimits.hasCostControl ? '' : 'text-muted-foreground'}>
                      Cost Control & Analytics
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {planLimits.hasPrioritySupport ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={planLimits.hasPrioritySupport ? '' : 'text-muted-foreground'}>
                      Priority Support
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {planLimits.hasApiAccess ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={planLimits.hasApiAccess ? '' : 'text-muted-foreground'}>
                      API Access
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isFree ? (
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full sm:w-auto"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              ) : (
                <Button
                  onClick={handleManageBilling}
                  disabled={loadingPortal}
                  className="w-full sm:w-auto"
                >
                  {loadingPortal ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage Billing
                    </>
                  )}
                </Button>
              )}

              {!isFree && (
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  View All Plans
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Details */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Current billing period and payment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{subscription.status}</span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">
                    {isTrialing ? 'Trial Ends' : 'Next Billing Date'}
                  </span>
                  <span className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.organizationId && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Linked to Organization</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
