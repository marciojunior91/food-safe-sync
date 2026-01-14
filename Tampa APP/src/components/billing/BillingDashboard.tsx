/**
 * BILLING DASHBOARD COMPONENT
 * 
 * Shows current subscription status, billing history, and management options
 * 
 * Created: January 14, 2026
 */

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import {
  CreditCard,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  formatAmount,
  formatSubscriptionStatus,
  getPlan,
  getTrialDaysRemaining,
  isSubscriptionActive,
  isSubscriptionTrialing,
} from '@/lib/stripe';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function BillingDashboard() {
  const {
    subscription,
    billingHistory,
    loading,
    error,
    cancelSubscription,
    reactivateSubscription,
    manageBilling,
    refresh,
  } = useSubscription();

  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  // Handle subscription cancellation
  const handleCancel = async () => {
    try {
      setCanceling(true);
      await cancelSubscription();
    } catch (err) {
      // Error already toasted in hook
    } finally {
      setCanceling(false);
    }
  };

  // Handle subscription reactivation
  const handleReactivate = async () => {
    try {
      setReactivating(true);
      await reactivateSubscription();
    } catch (err) {
      // Error already toasted in hook
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return <BillingDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You don't have an active subscription. Choose a plan to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = '/pricing')}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plan = getPlan(subscription.planType);
  const isActive = isSubscriptionActive(subscription);
  const isTrialing = isSubscriptionTrialing(subscription);
  const trialDays = getTrialDaysRemaining(subscription);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing details
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Trial Warning */}
      {isTrialing && trialDays !== null && trialDays <= 3 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-semibold">Trial Ending Soon</p>
                <p className="text-sm text-muted-foreground">
                  Your trial ends in {trialDays} {trialDays === 1 ? 'day' : 'days'}.
                  Update your payment method to continue.
                </p>
              </div>
              <Button onClick={manageBilling} size="sm" className="ml-auto">
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {plan?.description || 'Your subscription details'}
              </CardDescription>
            </div>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className="text-sm"
            >
              {formatSubscriptionStatus(subscription.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan</p>
              <p className="text-2xl font-bold">{plan?.name}</p>
              {plan && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatAmount(plan.price * 100, plan.currency)}/month
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isTrialing ? 'Trial Ends' : 'Renews'}
              </p>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(
                  new Date(
                    isTrialing && subscription.trialEnd
                      ? subscription.trialEnd
                      : subscription.currentPeriodEnd
                  ),
                  'MMM d, yyyy'
                )}
              </p>
              {isTrialing && trialDays !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  {trialDays} {trialDays === 1 ? 'day' : 'days'} remaining
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <p className="text-lg font-semibold">
                  {isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-sm text-destructive mt-1">
                  Cancels on{' '}
                  {format(new Date(subscription.currentPeriodEnd), 'MMM d')}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button onClick={manageBilling} variant="default">
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>

            {subscription.cancelAtPeriodEnd ? (
              <Button
                onClick={handleReactivate}
                disabled={reactivating}
                variant="outline"
              >
                {reactivating ? 'Reactivating...' : 'Reactivate Subscription'}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive">
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your subscription will remain active until{' '}
                      {format(
                        new Date(subscription.currentPeriodEnd),
                        'MMMM d, yyyy'
                      )}
                      . After that, you'll lose access to premium features.
                      <br />
                      <br />
                      You can reactivate anytime before the end date.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={canceling}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {canceling ? 'Canceling...' : 'Yes, Cancel'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No billing history yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.invoiceDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(item.amount, item.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === 'paid' ? 'default' : 'secondary'}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.invoicePdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={item.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </a>
                        </Button>
                      )}
                      {item.hostedInvoiceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={item.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton
function BillingDashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    </div>
  );
}
