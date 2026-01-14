// =====================================================
// STRIPE CHECKOUT SESSION - SUPABASE EDGE FUNCTION
// =====================================================
// Created: January 14, 2026
// Purpose: Create Stripe Checkout session for subscriptions
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body - organizationId is now optional
    const { priceId, successUrl, cancelUrl, trialDays } = await req.json();

    console.log('Creating checkout session:', { priceId, trialDays });

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT to get user info (without verification - Supabase already validated it)
    const decoded = jose.decodeJwt(token);
    const userId = decoded.sub;
    
    if (!userId) {
      console.error('No user ID in JWT token');
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user ID:', userId);
    
    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://imnecvcvhypnlvujajpn.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's email for Stripe customer (using Supabase Admin API)
    const { data: { user: authUser }, error: userError } = await supabase.auth.admin.getUserById(userId);

    const userEmail = authUser?.email || `user-${userId}@placeholder.com`;
    const userName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || 'User';

    console.log('User email:', userEmail);

    // Check if user already has a Stripe customer in any existing subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    let customerId = existingSubscription?.stripe_customer_id;

    if (!customerId) {
      console.log('Creating new Stripe customer...');
      
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: {
          userId: userId,
          supabaseUserId: userId,
        },
      });

      customerId = customer.id;
      console.log('Stripe customer created:', customerId);

      // Note: stripe_customer_id will be stored in subscriptions table by webhook
      // No need to update user record here
    }

    // Create Stripe Checkout session
    console.log('Creating Stripe checkout session...');
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/onboarding?subscription=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
      subscription_data: {
        trial_period_days: trialDays || 14,
        metadata: {
          userId: userId,
        },
      },
      metadata: {
        userId: userId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
