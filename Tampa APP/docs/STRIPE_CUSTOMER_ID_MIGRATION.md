# 🎯 STRIPE CUSTOMER ID MIGRATION

**Date**: January 14, 2026  
**Issue**: Column `organizations.stripe_customer_id` does not exist  
**Status**: ⏳ Pending Database Update

---

## 🔧 Problem

The Edge Function is trying to access `stripe_customer_id` column in the `organizations` table, but it doesn't exist yet.

**Error:**
```
column organizations.stripe_customer_id does not exist
```

---

## ✅ Solution Created

Migration file created: `supabase/migrations/20260114_add_stripe_customer_id.sql`

This migration:
- ✅ Adds `stripe_customer_id` column to `organizations` table
- ✅ Creates index for faster lookups
- ✅ Adds descriptive comment

---

## 🚀 How to Apply

### **Option 1: Supabase Dashboard** (Recommended)

1. **Open SQL Editor**  
   🔗 https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/editor

2. **Click "SQL Editor"** in sidebar

3. **Click "New query"**

4. **Paste this SQL** (already in your clipboard):

```sql
-- Add stripe_customer_id column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id 
ON organizations(stripe_customer_id);

-- Add comment
COMMENT ON COLUMN organizations.stripe_customer_id IS 
'Stripe Customer ID for billing and subscriptions';
```

5. **Click "Run"** or press `Ctrl+Enter`

6. **Verify Success**  
   You should see: "Success. No rows returned"

---

### **Option 2: CLI** (Alternative)

```bash
npx supabase db push
```

This will apply all pending migrations in the `supabase/migrations` folder.

---

## ✅ After Migration

Once you've applied the migration:

1. ✅ The `organizations` table will have the `stripe_customer_id` column
2. ✅ The Edge Function can store Stripe Customer IDs
3. ✅ Checkout flow will work completely

---

## 🧪 Test Again

After applying the migration:

1. 🌐 Go to: http://localhost:5173/pricing
2. 💳 Click **"Start Trial"**
3. 🎉 Should redirect to Stripe Checkout!

---

## 📊 Database Schema After Migration

```sql
-- organizations table (updated)
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  -- ... other columns ...
  stripe_customer_id TEXT,  -- ⭐ NEW COLUMN
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_organizations_stripe_customer_id 
ON organizations(stripe_customer_id);
```

---

## 🔍 Verification Query

After migration, run this to verify:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name = 'stripe_customer_id';

-- Should return:
-- column_name: stripe_customer_id
-- data_type: text
```

---

**🎯 Apply the migration and test the checkout flow!**
