/**
 * SUBSCRIPTION BADGE COMPONENT
 * 
 * Displays current subscription status and plan in the dashboard
 * Shows trial info, renewal dates, and quick access to billing
 * 
 * Created: January 14, 2026
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Zap, Rocket, CreditCard, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SubscriptionBadge() {
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
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const getPlanIcon = () => {
    switch (planLimits?.planType) {
      case 'starter':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'professional':
        return <Crown className="h-5 w-5 text-purple-500" />;
      case 'enterprise':
        return <Rocket className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getPlanColor = () => {
    switch (planLimits?.planType) {
      case 'starter':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'professional':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'enterprise':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusBadge = () => {
    if (isTrialing) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
          Trial Active
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
          Active
        </Badge>
      );
    }
    if (subscription?.status === 'past_due') {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
          Past Due
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className={`border-2 ${getPlanColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlanIcon()}
            <CardTitle className="text-lg capitalize">
              {planLimits?.planType || 'Free'} Plan
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {isFree && 'Upgrade to unlock more features'}
          {isTrialing && `${trialDaysRemaining} days left in trial`}
          {isActive && !isTrialing && `Renews in ${daysUntilRenewal} days`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Trial Warning */}
        {isTrialing && trialDaysRemaining !== null && trialDaysRemaining <= 3 && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Trial ending soon
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Your trial ends in {trialDaysRemaining} days. Add payment method to continue.
              </p>
            </div>
          </div>
        )}

        {/* Plan Limits Summary */}
        {planLimits && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Team Members</p>
              <p className="font-medium">
                {planLimits.maxTeamMembers === -1 ? 'Unlimited' : planLimits.maxTeamMembers}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Recipes</p>
              <p className="font-medium">
                {planLimits.maxRecipes === -1 ? 'Unlimited' : planLimits.maxRecipes}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Products</p>
              <p className="font-medium">
                {planLimits.maxProducts === -1 ? 'Unlimited' : planLimits.maxProducts}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Suppliers</p>
              <p className="font-medium">
                {planLimits.maxSuppliers === -1 ? 'Unlimited' : planLimits.maxSuppliers}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isFree ? (
            <Button
              onClick={() => navigate('/pricing')}
              className="w-full"
              size="sm"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/billing')}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
