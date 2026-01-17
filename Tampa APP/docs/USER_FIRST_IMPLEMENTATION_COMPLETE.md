# ✅ OPÇÃO A IMPLEMENTADA - USER-FIRST SUBSCRIPTIONS

**Date**: January 14, 2026  
**Architecture**: Subscription linked to USER first, then to organization  
**Status**: 🟢 Ready to test

---

## 🎯 What Was Implemented

### ✅ Database Schema Changes
- `subscriptions.user_id` added (PRIMARY LINK)
- `subscriptions.organization_id` now NULLABLE
- `stripe_customer_id` stored on user (not org)
- Indexes created for performance
- Helper functions created

### ✅ Edge Function Updated
- No longer requires `organizationId`
- Uses `userId` from JWT token
- Creates Stripe customer linked to user
- Stores `stripe_customer_id` on user record

### ✅ Frontend Updated
- Removed `organizationId` parameter from checkout
- Updated `createCheckoutSession()` function
- Updated `startCheckout()` function
- Updated `SubscriptionPlans` component

---

## 📊 New Flow

```
1. User logs in → Authenticated ✅
2. Goes to pricing page → Sees plans ✅
3. Clicks "Start Trial" → No org required ✅
4. Checkout created → Linked to userId ✅
5. Completes payment → Subscription active ✅
6. Redirected to onboarding → Creates organization ⏳
7. Onboarding completes → Auto-links subscription to org ⏳
```

---

## 🚀 Next Steps

### **STEP 1: Apply Migration SQL** (5 minutes)

1. **Open Supabase SQL Editor**  
   🔗 https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/editor

2. **Create New Query**

3. **Paste SQL** (already in clipboard - Ctrl+V)

4. **Run** (Ctrl+Enter)

5. **Verify Success**  
   Should see messages about updated tables and created functions

---

### **STEP 2: Test Checkout Flow** (10 minutes)

1. **Ensure you're logged in**  
   Go to: http://localhost:5173/login

2. **Navigate to pricing**  
   Go to: http://localhost:5173/pricing

3. **Click "Start Trial"** on any plan (try Professional - $99)

4. **Should redirect to Stripe Checkout** 🎉

5. **Complete payment** with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`

6. **Should redirect to onboarding**  
   URL: `/onboarding?subscription=success`

---

## 💡 Helper Functions Created

### `get_user_subscription(user_id)`
Get user's active subscription (with or without org).

```sql
SELECT * FROM get_user_subscription('USER_ID');
```

**Returns**:
- id, plan_type, status, trial_end, current_period_end
- organization_id (NULL if not linked yet)
- has_organization (boolean)

---

### `link_subscription_to_organization(user_id, org_id)`
Link user's subscription to organization (called during onboarding).

```sql
SELECT link_subscription_to_organization('USER_ID', 'ORG_ID');
```

**Returns**: `true` if successful, `false` if no subscription found

---

### `user_has_active_subscription(user_id)`
Check if user has active subscription.

```sql
SELECT user_has_active_subscription('USER_ID');
```

**Returns**: `true` or `false`

---

### `get_user_plan_limits(user_id)`
Get plan limits for user (regardless of org).

```sql
SELECT * FROM get_user_plan_limits('USER_ID');
```

**Returns**:
- plan_type
- max_team_members
- max_recipes
- max_products
- max_suppliers
- Feature flags (allergen_management, nutritional_calculator, etc.)

---

## 🔗 Onboarding Integration

When user completes onboarding and creates an organization, add this code:

```typescript
// In your onboarding completion handler
import { supabase } from '@/integrations/supabase/client';

// After organization is created
const { data: orgData } = await supabase
  .from('organizations')
  .insert({ name: 'My Organization', ... })
  .select()
  .single();

if (orgData) {
  // Link subscription to new organization
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('link_subscription_to_organization', {
    p_user_id: user.id,
    p_organization_id: orgData.id
  });

  if (data) {
    console.log('✅ Subscription linked to organization!');
  } else {
    console.log('ℹ️ No subscription to link (user on free plan)');
  }
}
```

---

## 📋 Database Schema (Updated)

```sql
-- subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),  -- ⭐ PRIMARY LINK
  organization_id UUID REFERENCES organizations(id), -- ⭐ NULL initially
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id) 
WHERE organization_id IS NOT NULL;

-- Unique constraint: one active subscription per user without org
CREATE UNIQUE INDEX idx_subscriptions_user_no_org 
ON subscriptions(user_id) 
WHERE organization_id IS NULL AND status IN ('active', 'trialing');
```

---

## 🧪 Testing Checklist

### Before Payment
- [ ] User can access /pricing without organization
- [ ] "Start Trial" button works
- [ ] Redirects to Stripe Checkout
- [ ] No error about missing organizationId

### During Payment
- [ ] Checkout page loads with correct plan
- [ ] Test card works (4242 4242 4242 4242)
- [ ] Email field pre-filled with user email

### After Payment
- [ ] Redirects to `/onboarding?subscription=success`
- [ ] Subscription created in database
- [ ] `subscriptions.user_id` is set
- [ ] `subscriptions.organization_id` is NULL
- [ ] `stripe_customer_id` stored on user

### After Onboarding
- [ ] Organization created successfully
- [ ] Subscription linked to organization
- [ ] `subscriptions.organization_id` now set
- [ ] User can access billing dashboard

---

## 🔍 Verification Queries

### Check user's subscription
```sql
SELECT 
  s.id,
  s.user_id,
  s.organization_id,
  s.plan_type,
  s.status,
  s.trial_end,
  u.email
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'YOUR_EMAIL';
```

### Check if subscription is linked
```sql
SELECT 
  s.id as subscription_id,
  s.plan_type,
  s.organization_id,
  s.organization_id IS NOT NULL as has_organization
FROM subscriptions s
WHERE s.user_id = 'YOUR_USER_ID';
```

---

## ⚠️ Important Notes

1. **No org required for checkout** - Subscription works without organization
2. **Auto-link in onboarding** - Make sure to call `link_subscription_to_organization()`
3. **One subscription per user** - Without org, user can only have one active subscription
4. **Free plan** - If no subscription, functions return free plan limits
5. **Migration safe** - Existing subscriptions are backfilled with user_id

---

## 📞 Support

If you encounter issues:

1. Check Edge Function logs:  
   https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/functions/stripe-create-checkout/logs

2. Check database:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
   ```

3. Check Stripe Dashboard:  
   https://dashboard.stripe.com/test/subscriptions

---

**🎯 Ready to test! Apply the SQL migration and try the checkout flow!**
