// =====================================================
// STRIPE WEBHOOK HANDLER - SUPABASE EDGE FUNCTION
// =====================================================
// Created: January 14, 2026
// Purpose: Handle Stripe webhook events and update database
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature header' }),
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    console.log('Webhook received:', event.type, event.id);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400 }
    );
  }

  // Create Supabase admin client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing subscription:', subscription.id);

        const organizationId = subscription.metadata.organizationId;
        if (!organizationId) {
          console.error('No organizationId in subscription metadata');
          break;
        }

        // Determine plan type from price ID
        const priceId = subscription.items.data[0]?.price.id;
        let planType = 'starter';
        
        const starterPrice = Deno.env.get('VITE_STRIPE_PRICE_STARTER');
        const professionalPrice = Deno.env.get('VITE_STRIPE_PRICE_PROFESSIONAL');
        const enterprisePrice = Deno.env.get('VITE_STRIPE_PRICE_ENTERPRISE');

        if (priceId === professionalPrice) planType = 'professional';
        else if (priceId === enterprisePrice) planType = 'enterprise';

        console.log('Plan type:', planType, 'Price ID:', priceId);

        // Upsert subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            organization_id: organizationId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            plan_type: planType,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
            trial_start: subscription.trial_start
              ? new Date(subscription.trial_start * 1000).toISOString()
              : null,
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          }, {
            onConflict: 'organization_id',
          });

        if (subError) {
          console.error('Error upserting subscription:', subError);
        } else {
          console.log('Subscription upserted successfully');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Deleting subscription:', subscription.id);

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);

        if (deleteError) {
          console.error('Error deleting subscription:', deleteError);
        } else {
          console.log('Subscription marked as canceled');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded:', invoice.id);

        const organizationId = invoice.metadata?.organizationId;
        if (!organizationId) {
          console.error('No organizationId in invoice metadata');
          break;
        }

        // Get subscription to link billing history
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .single();

        // Insert billing history
        const { error: billingError } = await supabase
          .from('billing_history')
          .insert({
            organization_id: organizationId,
            subscription_id: subscription?.id,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent as string,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'paid',
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
            invoice_date: new Date(invoice.created * 1000).toISOString(),
            paid_at: new Date().toISOString(),
          });

        if (billingError) {
          console.error('Error inserting billing history:', billingError);
        } else {
          console.log('Billing history recorded');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed:', invoice.id);

        const organizationId = invoice.metadata?.organizationId;
        if (!organizationId) {
          console.error('No organizationId in invoice metadata');
          break;
        }

        // Record failed payment
        const { error: billingError } = await supabase
          .from('billing_history')
          .insert({
            organization_id: organizationId,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'uncollectible',
            invoice_date: new Date(invoice.created * 1000).toISOString(),
          });

        if (billingError) {
          console.error('Error inserting failed payment:', billingError);
        } else {
          console.log('Failed payment recorded');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
