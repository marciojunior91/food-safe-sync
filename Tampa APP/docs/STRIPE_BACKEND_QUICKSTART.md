# 🚀 QUICK START: Stripe Backend Implementation

**Goal**: Get payments working end-to-end in ~3 hours  
**Status**: Frontend complete, backend needed  
**Difficulty**: Intermediate

---

## 📋 PREREQUISITES

- ✅ Frontend code deployed (completed)
- ✅ Database schema deployed
- ⬜ Stripe account (test mode)
- ⬜ Supabase project with Edge Functions enabled

---

## ⚡ STEP 1: Deploy Database (5 minutes)

### Run SQL Script

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `docs/sql-scripts/create-subscriptions-tables.sql`
3. Click "Run"
4. Verify tables created:
   ```sql
   SELECT * FROM subscriptions LIMIT 1;
   SELECT * FROM billing_history LIMIT 1;
   ```

---

## 🔑 STEP 2: Stripe Account Setup (15 minutes)

### 2.1 Create Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up / Log in
3. Enable **Test Mode** (toggle in top-right)

### 2.2 Create Products

**Product 1: Starter**
- Name: Tampa APP - Starter
- Description: Perfect for small restaurants
- Add Price: $49 AUD / month (recurring)
- Copy Price ID: `price_xxxxx` → Save for later

**Product 2: Professional**
- Name: Tampa APP - Professional  
- Description: For growing restaurants
- Add Price: $99 AUD / month (recurring)
- Copy Price ID: `price_xxxxx` → Save for later

**Product 3: Enterprise**
- Name: Tampa APP - Enterprise
- Description: For restaurant groups
- Add Price: $299 AUD / month (recurring)
- Copy Price ID: `price_xxxxx` → Save for later

### 2.3 Get API Keys
- Dashboard → Developers → API Keys
- Copy **Publishable key** (pk_test_...)
- Copy **Secret key** (sk_test_...)
- Keep these safe!

### 2.4 Enable Customer Portal
- Dashboard → Settings → Billing → Customer Portal
- Click "Activate test link"
- Enable:
  - ✅ Invoice history
  - ✅ Update payment method
  - ✅ Cancel subscription
- Return URL: `https://your-app.com/settings/billing`
- Save

---

## 🔧 STEP 3: Environment Variables (2 minutes)

### Create `.env.local` (Development)
```bash
# Stripe Test Mode
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Stripe Price IDs
VITE_STRIPE_PRICE_STARTER=price_xxxxx
VITE_STRIPE_PRICE_PROFESSIONAL=price_xxxxx
VITE_STRIPE_PRICE_ENTERPRISE=price_xxxxx
```

### Add to Supabase Edge Functions
```bash
# In supabase dashboard or CLI
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
```

---

## 💻 STEP 4: Build Edge Functions (2-3 hours)

### 4.1 Create Checkout Session Endpoint

**File**: `supabase/functions/stripe-create-checkout/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.5.0?target=deno';

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
    const { priceId, organizationId, successUrl, cancelUrl, trialDays } = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Verify user & get organization
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { data: { user }, error: authError } = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      { headers: { Authorization: authHeader } }
    ).then(r => r.json());

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get or create Stripe customer
    const { data: org } = await fetch(
      `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` } }
    ).then(r => r.json());

    let customerId = org[0]?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { organizationId },
      });
      customerId = customer.id;

      // Update organization with customer ID
      await fetch(
        `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stripe_customer_id: customerId }),
        }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialDays || 14,
        metadata: { organizationId },
      },
      metadata: { organizationId },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4.2 Webhook Handler

**File**: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.5.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          organization_id: subscription.metadata.organizationId,
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          plan_type: getPlanType(subscription),
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        }),
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscription.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'canceled' }),
        }
      );
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      
      await fetch(`${supabaseUrl}/rest/v1/billing_history`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: invoice.metadata?.organizationId,
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id: invoice.payment_intent,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'paid',
          invoice_pdf: invoice.invoice_pdf,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_date: new Date(invoice.created * 1000),
          paid_at: new Date(),
        }),
      });
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

function getPlanType(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id;
  
  if (priceId === Deno.env.get('VITE_STRIPE_PRICE_STARTER')) return 'starter';
  if (priceId === Deno.env.get('VITE_STRIPE_PRICE_PROFESSIONAL')) return 'professional';
  if (priceId === Deno.env.get('VITE_STRIPE_PRICE_ENTERPRISE')) return 'enterprise';
  
  return 'starter';
}
```

### 4.3 Deploy Functions

```bash
# Deploy to Supabase
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-webhook

# Get webhook URL
echo "Webhook URL: https://your-project.supabase.co/functions/v1/stripe-webhook"
```

---

## 🔗 STEP 5: Configure Stripe Webhook (5 minutes)

1. Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy **Signing secret** (whsec_...)
7. Add to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## 🧪 STEP 6: Test Payment Flow (30 minutes)

### 6.1 Test Checkout
1. Navigate to `/pricing` in your app
2. Click "Start Trial" on Professional plan
3. Should redirect to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Expiry: Any future date
6. CVC: Any 3 digits
7. Complete payment
8. Should redirect back to success URL

### 6.2 Verify Database
```sql
-- Check subscription was created
SELECT * FROM subscriptions;

-- Check billing history
SELECT * FROM billing_history;
```

### 6.3 Test Billing Dashboard
1. Navigate to `/settings/billing`
2. Should see:
   - Current plan
   - Trial status
   - Next billing date
3. Click "Manage Billing"
4. Should open Stripe Customer Portal

### 6.4 Test Cancellation
1. In billing dashboard, click "Cancel Subscription"
2. Confirm cancellation
3. Should see "Cancels on [date]"
4. Click "Reactivate"
5. Should see "Active" again

---

## 🎉 SUCCESS CHECKLIST

- ✅ Database tables created
- ✅ Stripe products created
- ✅ Environment variables set
- ✅ Edge functions deployed
- ✅ Webhook configured
- ✅ Test payment successful
- ✅ Subscription visible in dashboard
- ✅ Billing history showing
- ✅ Customer Portal accessible
- ✅ Cancel/reactivate working

---

## 🐛 TROUBLESHOOTING

### Checkout not redirecting
- Check `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Verify Price IDs match Stripe dashboard
- Check browser console for errors

### Webhook not firing
- Verify endpoint URL is correct
- Check webhook signing secret is set
- View webhook logs in Stripe dashboard

### Database not updating
- Check RLS policies are set
- Verify service role key has permissions
- Check Supabase function logs

### Test Card Declined
- Use `4242 4242 4242 4242` (always succeeds)
- For failed payment: `4000 0000 0000 0341`
- For authentication: `4000 0025 0000 3155`

---

## 📱 GOING LIVE

When ready for production:

1. **Stripe**: Switch to Live Mode
2. **Re-create products** in live mode
3. **Update environment variables** with live keys
4. **Update webhook endpoint** to production URL
5. **Test with real card** (small amount)
6. **Monitor** Stripe dashboard for first 24 hours

---

## 🎓 LEARNING RESOURCES

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Testing Stripe](https://stripe.com/docs/testing)

---

**Estimated Total Time**: 3-4 hours  
**Difficulty**: ⭐⭐⭐ Intermediate  
**Result**: 💰 Fully functional payment system!

Good luck! 🚀
