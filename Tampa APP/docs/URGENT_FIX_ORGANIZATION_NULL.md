# URGENT FIX: Organization ID Null Issue

## Problem

After running Part 2 migration, the People module shows:
```
Please log in to view team members.
Debug: Context loaded = loaded, Organization ID = null
```

Organization is no longer appearing in the header.

## Root Cause

The `get_current_user_context()` function in Part 2 migration tries to return `location_id` from the organizations table:

```sql
SELECT 
  p.user_id,
  p.organization_id,
  ...
  o.location_id  ← This column doesn't exist!
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
```

When a column doesn't exist, the function fails and returns NULL for all fields.

## Solution

Run this migration to fix the function:

**File**: `supabase/migrations/20260110_fix_get_current_user_context_location_id.sql`

### Steps to Apply:

1. **Go to Supabase SQL Editor**:
   https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new

2. **Copy the entire contents** of:
   ```
   supabase/migrations/20260110_fix_get_current_user_context_location_id.sql
   ```

3. **Paste and Run** in SQL Editor

4. **Refresh your browser** (F5)

5. ✅ **Expected**: Organization appears in header, People module works

## What This Does

- Drops the broken `get_current_user_context()` function
- Recreates it WITHOUT the `location_id` column
- Returns only: `user_id`, `organization_id`, `role`, `department_id`

## After Fix

The function will return:
```typescript
{
  user_id: "abc-123",
  organization_id: "xyz-789",  ← No longer null!
  role: "admin",
  department_id: "dept-456"
}
```

---

**Priority**: URGENT - Blocks all People module functionality  
**Time to Fix**: 1 minute  
**Last Updated**: January 10, 2026
