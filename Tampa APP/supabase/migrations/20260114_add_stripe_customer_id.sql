-- =====================================================
-- ADD STRIPE CUSTOMER ID TO ORGANIZATIONS
-- =====================================================
-- Created: January 14, 2026
-- Purpose: Add stripe_customer_id column to organizations table
-- =====================================================

-- Add stripe_customer_id column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id 
ON organizations(stripe_customer_id);

-- Add comment
COMMENT ON COLUMN organizations.stripe_customer_id IS 
'Stripe Customer ID for billing and subscriptions';
