/**
 * STRIPE CUSTOMER PORTAL - EDGE FUNCTION
 * 
 * Creates a Stripe Customer Portal session
 * Allows customers to manage subscriptions, payment methods, and billing
 * 
 * Created: January 14, 2026
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
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
    // Extract and verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jose.decodeJwt(token);
    const userId = decoded.sub;

    if (!userId) {
      throw new Error('Invalid token: missing user ID');
    }

    console.log('Creating portal session for user:', userId);

    // Parse request body
    const { customerId, returnUrl } = await req.json();

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || req.headers.get('origin') || 'http://localhost:5173/billing',
    });

    console.log('Portal session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating portal session:', error);
    
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
