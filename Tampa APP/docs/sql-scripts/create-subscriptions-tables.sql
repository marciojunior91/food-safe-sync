-- =====================================================
-- SUBSCRIPTIONS & BILLING TABLES
-- =====================================================
-- Created: January 14, 2026
-- Purpose: Support Stripe payment integration and subscription management
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS billing_history CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
-- Stores organization subscription details linked to Stripe
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Stripe identifiers
    stripe_customer_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    
    -- Plan details
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
    
    -- Billing period
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    
    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_org_subscription UNIQUE (organization_id)
);

-- Index for fast lookups
CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Updated timestamp trigger
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BILLING HISTORY TABLE
-- =====================================================
-- Stores all billing transactions and invoices
CREATE TABLE billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Stripe invoice details
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_payment_intent_id TEXT,
    
    -- Amount (stored in cents)
    amount INTEGER NOT NULL, -- e.g., 4900 = $49.00
    currency TEXT NOT NULL DEFAULT 'aud',
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    
    -- Payment details
    payment_method TEXT, -- card, bank_transfer, etc.
    payment_method_details JSONB,
    
    -- Links
    invoice_pdf TEXT, -- URL to Stripe-hosted PDF
    hosted_invoice_url TEXT, -- URL to Stripe-hosted invoice page
    
    -- Dates
    invoice_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Line items (for detailed breakdown)
    line_items JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_billing_history_org_id ON billing_history(organization_id);
CREATE INDEX idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX idx_billing_history_stripe_invoice ON billing_history(stripe_invoice_id);
CREATE INDEX idx_billing_history_status ON billing_history(status);
CREATE INDEX idx_billing_history_paid_at ON billing_history(paid_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
-- Admins and managers can view their organization's subscription
CREATE POLICY "Users can view organization subscription"
    ON subscriptions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Only admins can update subscription (for cancellation requests)
CREATE POLICY "Admins can update subscription"
    ON subscriptions FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System can insert/update via service role (Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Billing history policies
-- Admins and managers can view billing history
CREATE POLICY "Users can view organization billing"
    ON billing_history FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- System can insert via service role (Stripe webhooks)
CREATE POLICY "Service role can manage billing"
    ON billing_history FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if organization has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE organization_id = org_id
        AND status IN ('active', 'trialing')
        AND current_period_end > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription plan limits
CREATE OR REPLACE FUNCTION get_plan_limits(org_id UUID)
RETURNS TABLE(
    max_users INTEGER,
    max_locations INTEGER,
    has_feed BOOLEAN,
    has_knowledge_base BOOLEAN,
    has_training_center BOOLEAN,
    has_api_access BOOLEAN
) AS $$
DECLARE
    v_plan_type TEXT;
BEGIN
    -- Get current plan type
    SELECT plan_type INTO v_plan_type
    FROM subscriptions
    WHERE organization_id = org_id
    AND status IN ('active', 'trialing');
    
    -- Return limits based on plan
    RETURN QUERY
    SELECT 
        CASE v_plan_type
            WHEN 'starter' THEN 10
            WHEN 'professional' THEN 50
            WHEN 'enterprise' THEN 999999
            ELSE 5 -- Free tier
        END AS max_users,
        CASE v_plan_type
            WHEN 'starter' THEN 1
            WHEN 'professional' THEN 3
            WHEN 'enterprise' THEN 999999
            ELSE 1
        END AS max_locations,
        CASE v_plan_type
            WHEN 'professional' THEN TRUE
            WHEN 'enterprise' THEN TRUE
            ELSE FALSE
        END AS has_feed,
        CASE v_plan_type
            WHEN 'professional' THEN TRUE
            WHEN 'enterprise' THEN TRUE
            ELSE FALSE
        END AS has_knowledge_base,
        CASE v_plan_type
            WHEN 'professional' THEN TRUE
            WHEN 'enterprise' THEN TRUE
            ELSE FALSE
        END AS has_training_center,
        CASE v_plan_type
            WHEN 'enterprise' THEN TRUE
            ELSE FALSE
        END AS has_api_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA (Test subscription)
-- =====================================================
-- This will be replaced with real Stripe data in production

-- Example: Add a test subscription for development
-- UNCOMMENT FOR DEV ENVIRONMENT ONLY
/*
INSERT INTO subscriptions (
    organization_id,
    stripe_customer_id,
    stripe_subscription_id,
    plan_type,
    status,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end
) VALUES (
    (SELECT id FROM organizations LIMIT 1), -- Replace with your test org ID
    'cus_test_' || gen_random_uuid()::TEXT,
    'sub_test_' || gen_random_uuid()::TEXT,
    'professional',
    'trialing',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW() + INTERVAL '14 days'
) ON CONFLICT (organization_id) DO NOTHING;
*/

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE subscriptions IS 'Organization subscription details synced with Stripe';
COMMENT ON TABLE billing_history IS 'Complete billing transaction history from Stripe';

COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID (cus_...)';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_...)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';

COMMENT ON COLUMN billing_history.amount IS 'Amount in cents (e.g., 4900 = $49.00)';
COMMENT ON COLUMN billing_history.line_items IS 'JSONB array of invoice line items from Stripe';

COMMENT ON FUNCTION has_active_subscription IS 'Check if organization has an active or trialing subscription';
COMMENT ON FUNCTION get_plan_limits IS 'Get feature limits based on organization subscription plan';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
DO $$
BEGIN
    RAISE NOTICE 'Subscriptions table created: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'subscriptions');
    RAISE NOTICE 'Billing history table created: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'billing_history');
END $$;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
