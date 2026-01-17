-- =====================================================
-- STRIPE SUBSCRIPTION SCHEMA - USER-FIRST APPROACH
-- =====================================================
-- Created: January 14, 2026
-- Architecture: Subscription linked to user, then to organization
-- Flow: Login → Pricing → Checkout → Onboarding → Link to org
-- =====================================================

-- Add user_id to subscriptions table (primary link)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Make organization_id nullable (can be null initially)
ALTER TABLE subscriptions 
ALTER COLUMN organization_id DROP NOT NULL;

-- Add stripe_customer_id to subscriptions (store per subscription)
-- This is where we'll store the Stripe customer ID
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add stripe_customer_id to organizations (for when user links subscription)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id 
ON subscriptions(organization_id) 
WHERE organization_id IS NOT NULL;

-- Add unique constraint: one active subscription per user without org
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_no_org 
ON subscriptions(user_id) 
WHERE organization_id IS NULL AND status IN ('active', 'trialing');

-- Add comments
COMMENT ON COLUMN subscriptions.user_id IS 
'User who owns the subscription. Primary link.';

COMMENT ON COLUMN subscriptions.organization_id IS 
'Organization linked to subscription. NULL until onboarding completes.';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get user's active subscription (with or without org)
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_type TEXT,
  status TEXT,
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  organization_id UUID,
  has_organization BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_type,
    s.status,
    s.trial_end,
    s.current_period_end,
    s.organization_id,
    s.organization_id IS NOT NULL as has_organization
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Link user's subscription to organization (during onboarding)
CREATE OR REPLACE FUNCTION link_subscription_to_organization(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id UUID;
  v_stripe_customer_id TEXT;
BEGIN
  -- Get user's subscription
  SELECT id, stripe_customer_id 
  INTO v_subscription_id, v_stripe_customer_id
  FROM subscriptions
  WHERE user_id = p_user_id 
    AND organization_id IS NULL
    AND status IN ('active', 'trialing')
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RAISE NOTICE 'No subscription found for user %', p_user_id;
    RETURN FALSE;
  END IF;

  -- Update subscription with organization_id
  UPDATE subscriptions
  SET 
    organization_id = p_organization_id,
    updated_at = NOW()
  WHERE id = v_subscription_id;

  -- Copy stripe_customer_id to organization
  IF v_stripe_customer_id IS NOT NULL THEN
    UPDATE organizations
    SET stripe_customer_id = v_stripe_customer_id
    WHERE id = p_organization_id;
  END IF;

  RAISE NOTICE 'Subscription % linked to organization %', v_subscription_id, p_organization_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = p_user_id 
      AND status IN ('active', 'trialing')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get plan limits for user (regardless of org)
CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id UUID)
RETURNS TABLE (
  plan_type TEXT,
  max_team_members INTEGER,
  max_recipes INTEGER,
  max_products INTEGER,
  max_suppliers INTEGER,
  has_allergen_management BOOLEAN,
  has_nutritional_calculator BOOLEAN,
  has_cost_control BOOLEAN,
  has_api_access BOOLEAN,
  has_priority_support BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.plan_type, 'free') as plan_type,
    CASE COALESCE(s.plan_type, 'free')
      WHEN 'starter' THEN 5
      WHEN 'professional' THEN 20
      WHEN 'enterprise' THEN -1  -- unlimited
      ELSE 1  -- free plan
    END as max_team_members,
    CASE COALESCE(s.plan_type, 'free')
      WHEN 'starter' THEN 100
      WHEN 'professional' THEN 500
      WHEN 'enterprise' THEN -1  -- unlimited
      ELSE 10  -- free plan
    END as max_recipes,
    CASE COALESCE(s.plan_type, 'free')
      WHEN 'starter' THEN 200
      WHEN 'professional' THEN 1000
      WHEN 'enterprise' THEN -1  -- unlimited
      ELSE 20  -- free plan
    END as max_products,
    CASE COALESCE(s.plan_type, 'free')
      WHEN 'starter' THEN 50
      WHEN 'professional' THEN 200
      WHEN 'enterprise' THEN -1  -- unlimited
      ELSE 10  -- free plan
    END as max_suppliers,
    COALESCE(s.plan_type, 'free') IN ('professional', 'enterprise') as has_allergen_management,
    COALESCE(s.plan_type, 'free') IN ('professional', 'enterprise') as has_nutritional_calculator,
    COALESCE(s.plan_type, 'free') IN ('professional', 'enterprise') as has_cost_control,
    COALESCE(s.plan_type, 'free') = 'enterprise' as has_api_access,
    COALESCE(s.plan_type, 'free') IN ('professional', 'enterprise') as has_priority_support
  FROM (
    SELECT s.plan_type
    FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1
  ) s;
  
  -- If no subscription found, return free plan limits
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'free'::TEXT,
      1::INTEGER,
      10::INTEGER,
      20::INTEGER,
      10::INTEGER,
      FALSE::BOOLEAN,
      FALSE::BOOLEAN,
      FALSE::BOOLEAN,
      FALSE::BOOLEAN,
      FALSE::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES UPDATE
-- =====================================================

-- Allow users to view their own subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  organization_id IN (
    SELECT organization_id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
);

-- Service role can manage all subscriptions
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage subscriptions"
ON subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- DATA MIGRATION (if existing data)
-- =====================================================

-- Skip backfill - most likely no existing subscriptions yet
-- If needed, can be done manually later

-- Log that migration is complete
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription schema updated for user-first approach';
  RAISE NOTICE '✅ Helper functions created successfully';
  RAISE NOTICE '✅ RLS policies updated';
  RAISE NOTICE 'ℹ️  Skipped backfill - no existing subscriptions expected';
END $$;
