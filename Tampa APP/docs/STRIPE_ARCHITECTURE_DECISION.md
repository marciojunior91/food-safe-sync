# 🎯 STRIPE INTEGRATION - ARCHITECTURE DECISION

**Date**: January 14, 2026  
**Issue**: Pricing page before onboarding - no organization exists yet  
**Status**: 🤔 Architecture Design Needed

---

## 🔍 Current Situation

**User's Flow**:
```
Login → Pricing Page (choose plan) → Stripe Checkout → Onboarding (create org)
```

**Problem**: 
- When user clicks "Start Trial", we don't have `organizationId` yet
- Organization is created AFTER payment in onboarding
- Subscription needs to be linked to something

---

## 💡 Solution Options

### **OPTION A: Subscription Linked to User First** ⭐ RECOMMENDED

**Flow**:
```
1. User clicks "Start Trial" on pricing page
2. Create checkout with userId (no organizationId)
3. User completes payment → subscription active
4. User goes to onboarding → creates organization
5. Link subscription to organization at that moment
```

**Database Structure**:
```sql
-- subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),  -- ⭐ PRIMARY LINK
  organization_id UUID REFERENCES organizations(id), -- ⭐ NULL initially
  stripe_subscription_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Advantages**:
- ✅ Works with your current flow
- ✅ User can pay before onboarding
- ✅ Simple migration when org is created
- ✅ One subscription per user initially

**Implementation**:
1. Remove `organizationId` from checkout parameters
2. Create subscription linked to `userId`
3. In onboarding, when org is created, update subscription:
   ```sql
   UPDATE subscriptions 
   SET organization_id = 'NEW_ORG_ID'
   WHERE user_id = 'USER_ID' AND organization_id IS NULL;
   ```

---

### **OPTION B: Create Organization During Checkout**

**Flow**:
```
1. User clicks "Start Trial"
2. Create temporary organization automatically
3. Link checkout to that organization
4. In onboarding, user customizes the organization
```

**Advantages**:
- ✅ Organization exists from start
- ✅ Simpler subscription model
- ✅ No migration needed

**Disadvantages**:
- ❌ Organization created without user input
- ❌ Need default names like "User's Organization"
- ❌ Extra step to customize in onboarding

---

### **OPTION C: Change Flow - Onboarding First**

**Flow**:
```
1. User logs in
2. Required onboarding → create organization
3. Then access dashboard
4. Go to pricing when ready to upgrade
```

**Advantages**:
- ✅ Clean architecture - org exists first
- ✅ All subscriptions linked to orgs
- ✅ Standard SaaS pattern

**Disadvantages**:
- ❌ Requires changing your UX flow
- ❌ User can't see pricing before onboarding
- ❌ Forced onboarding might hurt conversion

---

## 🎯 Recommendation: OPTION A

**Why**:
1. Respects your current UX flow
2. User can see pricing and pay immediately
3. Flexible - handles both scenarios:
   - User pays → then creates org
   - User creates org → then pays
4. Easy to implement

**Changes Needed**:
1. Update `subscriptions` table schema
2. Modify Edge Function to use `userId` instead of `organizationId`
3. Add migration logic in onboarding to link subscription to org
4. Update frontend to not require `organizationId` for checkout

---

## 📊 Updated Database Schema (Option A)

```sql
-- subscriptions table (UPDATED)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id), -- CAN BE NULL
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(stripe_subscription_id),
  UNIQUE(user_id) WHERE organization_id IS NULL  -- One subscription per user without org
);

-- Index for user lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Index for org lookups
CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);

-- Helper function: Get user's subscription (with or without org)
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_type TEXT,
  status TEXT,
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_type,
    s.status,
    s.trial_end,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Link subscription to organization
CREATE OR REPLACE FUNCTION link_subscription_to_org(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions
  SET organization_id = p_organization_id,
      updated_at = NOW()
  WHERE user_id = p_user_id 
    AND organization_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🚀 Implementation Steps (Option A)

### Step 1: Update Database Schema
```sql
-- Add user_id column (if not exists)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Make organization_id nullable
ALTER TABLE subscriptions 
ALTER COLUMN organization_id DROP NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON subscriptions(user_id);
```

### Step 2: Update Edge Function
Remove `organizationId` requirement, use `userId` from JWT.

### Step 3: Update Frontend
Remove `organizationId` from checkout parameters.

### Step 4: Update Onboarding
When user creates organization, link subscription:
```typescript
// In onboarding completion
await supabase.rpc('link_subscription_to_org', {
  p_user_id: user.id,
  p_organization_id: newOrganization.id
});
```

---

## ❓ Questions to Answer

1. **What is your preferred flow?** (A, B, or C)
2. **Can users use the app without organization?** (personal use vs team use)
3. **Should subscription be per-user or per-organization?**
4. **What happens if user creates multiple organizations?**

---

**🎯 Which option do you prefer? Let's implement it correctly from the start!**
