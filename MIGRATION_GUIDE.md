# Database Migration Guide for Production

## Issue Summary

The application is experiencing 404 errors because the following database tables and views are missing from the production database:

- `prepared_items` table
- `waste_logs` table  
- `compliance_checks` table
- `efficiency_analytics` view (depends on `production_metrics` and `recipes` tables)

These database objects are defined in the migration files but have not been applied to the production database.

## Migration Files to Apply

The following migration files need to be applied to production in order:

### 1. Prepared Items Table
**File**: `supabase/migrations/20250821021540_e0ffb114-affe-4476-80be-89dac17aba69.sql`

This creates the `prepared_items` table used to track prepared recipe items with their expiration dates.

### 2. Analytics Tables and Views
**File**: `supabase/migrations/20251006215528_174a5289-c7c1-463c-80f7-f08802ce581b.sql`

This creates:
- `waste_logs` table - for tracking food waste
- `compliance_checks` table - for compliance monitoring
- `production_metrics` table - for tracking recipe production metrics
- `waste_analytics` view - aggregated waste data
- `efficiency_analytics` view - aggregated production efficiency data
- `compliance_summary` view - aggregated compliance data

### 3. Additional Analytics
**File**: `supabase/migrations/20251006215603_843ab8b2-7de8-4d0e-af6b-cc7cf3a2442d.sql`

This updates the `efficiency_analytics` view with improved logic.

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI if not already installed
npm install -g supabase

# 2. Link to your production project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Apply pending migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open each migration file in order and execute the SQL
4. Verify the tables were created in the **Table Editor**

### Option 3: Using SQL Direct Connection

If you have direct database access:

```bash
# Connect to your database
psql YOUR_DATABASE_CONNECTION_STRING

# Run each migration file
\i supabase/migrations/20250821021540_e0ffb114-affe-4476-80be-89dac17aba69.sql
\i supabase/migrations/20251006215528_174a5289-c7c1-463c-80f7-f08802ce581b.sql
\i supabase/migrations/20251006215603_843ab8b2-7de8-4d0e-af6b-cc7cf3a2442d.sql
```

## Verification Steps

After applying migrations, verify in the Supabase dashboard:

1. **Table Editor** - Check that these tables exist:
   - `prepared_items`
   - `waste_logs`
   - `compliance_checks`
   - `production_metrics`

2. **SQL Editor** - Run verification queries:

```sql
-- Check prepared_items table
SELECT COUNT(*) FROM prepared_items;

-- Check waste_logs table
SELECT COUNT(*) FROM waste_logs;

-- Check compliance_checks table
SELECT COUNT(*) FROM compliance_checks;

-- Check efficiency_analytics view
SELECT * FROM efficiency_analytics LIMIT 1;
```

3. **RLS Policies** - Verify Row Level Security policies were created for each table

## Post-Migration

Once migrations are applied, the application should:
- No longer show PGRST205 errors in the console
- Display analytics data properly in the dashboard
- Allow logging of waste and compliance checks
- Show prepared items and expiry alerts

## Code Changes Made

The code has been updated with defensive programming to handle cases where tables don't exist:

- All database queries now check for PGRST205 error code (table not found)
- Components gracefully handle missing data with empty states
- Console warnings indicate when tables are missing
- Application no longer crashes when tables are unavailable

This means the app will work (without full functionality) even if migrations haven't been applied yet, but for full functionality, the migrations must be applied to production.

## Important Notes

- **Backup First**: Always backup your production database before applying migrations
- **Test in Staging**: If possible, test migrations in a staging environment first
- **Order Matters**: Apply migrations in the order listed above
- **Dependencies**: Some migrations depend on tables from previous migrations
- **RLS Policies**: Ensure your user has proper permissions to access the new tables

## Support

If you encounter issues applying migrations:

1. Check Supabase logs for detailed error messages
2. Verify your database user has CREATE TABLE permissions
3. Ensure dependent tables (like `recipes`, `profiles`) exist
4. Check that RLS policies don't conflict with existing policies
