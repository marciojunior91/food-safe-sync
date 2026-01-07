# Quick Start: Fix Expiry Badges

## The Problem
Expiry badges aren't showing because the `printed_labels` table is missing the `organization_id` column.

## Quick Fix (Apply Now)

### ✅ Already Done - Temporary Code Fix
The organization filter has been temporarily removed from the code so expiry badges will work immediately. However, this means labels from all organizations are visible (not ideal for multi-tenant security).

### 🔧 To Do - Apply Database Migration

#### Option 1: Using Supabase Dashboard (Recommended)
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste this file: `supabase/migrations/20241228010000_add_organization_to_printed_labels.sql`
5. Click **Run**
6. Wait for success message

#### Option 2: Using Supabase CLI
```bash
# Make sure you're in the project directory
cd "C:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"

# Push the migration
supabase db push
```

### ✅ Verify Migration Worked
Run this query in SQL Editor:
```sql
-- Should return rows with organization_id populated
SELECT id, product_name, organization_id, expiry_date 
FROM printed_labels 
LIMIT 5;
```

Expected result: All rows should have `organization_id` values.

### 🔄 Re-Enable Organization Filtering
After migration succeeds, uncomment these lines:

**File 1**: `src/pages/Labeling.tsx` (around line 156)
```typescript
// Remove comment from this line:
.eq('organization_id', profile.organization_id)
```

**File 2**: `src/components/labels/QuickPrintGrid.tsx` (around line 318)
```typescript
// Remove comment from this line:
.eq('organization_id', profile.organization_id)
```

## What This Migration Does

1. ✅ Adds `organization_id` column to `printed_labels` table
2. ✅ Fills in organization_id for all existing labels (based on product's organization)
3. ✅ Creates indexes for fast queries
4. ✅ Updates RLS policies for proper multi-tenant security
5. ✅ Adds foreign key constraints for data integrity

## Expected Results

### After Migration
- ✅ Expiry badges appear in all views
- ✅ Correct colors (green/orange/red) based on expiry status
- ✅ Only labels from your organization are visible
- ✅ Multi-tenant data isolation enforced
- ✅ Better query performance with indexes

### If Something Goes Wrong
The migration is designed to be safe:
- Uses `IF NOT EXISTS` checks
- Updates data before adding constraints
- Falls back to default organization for orphaned data
- Doesn't delete any existing data

## Testing After Migration

1. **Check Badges Appear**
   - Go to Labeling → Quick Print
   - Switch between "By Products" and "By Categories"
   - Switch between Grid and List views
   - Verify expiry badges show up with correct colors

2. **Check Organization Filtering**
   - Verify you only see labels from your organization
   - Test with different user accounts if available

3. **Print a New Label**
   - Create and print a label
   - Verify it appears with expiry badge
   - Check the badge color matches the expiry date

## Timeline

- **Immediate** (Now): Expiry badges work, but no organization filtering
- **After Migration** (5 minutes): Full multi-tenant security + expiry badges working perfectly

## Need Help?

If migration fails, check:
1. Do you have admin access to Supabase?
2. Is the database connection working?
3. Check error message in SQL Editor
4. See full documentation in: `EXPIRY_BADGE_ROOT_CAUSE_FIX.md`

## Status Tracking

- [x] Temporary code fix applied (organization filter removed)
- [x] Migration file created
- [ ] Migration applied to database
- [ ] Organization filters re-enabled in code
- [ ] Tested and verified working

---

**Current State**: Expiry badges working, but need to apply migration for proper security.

**Next Step**: Apply the migration using either the Dashboard or CLI method above.
