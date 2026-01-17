# 🔴 STILL FAILING - Emergency Diagnostic Steps

## Error
```json
{
    "statusCode": "403",
    "error": "Unauthorized",
    "message": "new row violates row-level security policy"
}
```

## 🚨 Critical Analysis

The 403 error after running the proper policies means one of these:

1. **Policies didn't apply** - Still using old policies
2. **Role check failing** - `has_any_role()` returning false
3. **Organization mismatch** - User and team member in different orgs
4. **Missing data** - organization_id is NULL somewhere
5. **Auth issue** - auth.uid() not working properly

---

## ✅ Step-by-Step Diagnosis

### Step 1: Run Ultra-Simple Policies (5 seconds)

**File**: `emergency-simple-policies.sql`

```sql
-- This removes ALL checks - allows ANY authenticated user
-- If this FAILS, problem is NOT the policies!
```

**Run this file and test upload immediately.**

**Results**:
- ✅ **Upload WORKS**: Problem is policy logic → Go to Step 3
- ❌ **Upload FAILS**: Problem is deeper → Go to Step 2

---

### Step 2: Check Table Structure (If Step 1 FAILED)

**File**: `check-table-structure.sql`

This checks:
- Table columns (does organization_id exist?)
- Constraints and foreign keys
- Triggers that might block inserts
- RLS status

**Share the output!** We need to see if there's a constraint or trigger blocking.

---

### Step 3: Check Your User Data (If Step 1 WORKED)

**File**: `diagnose-current-user.sql`

**IMPORTANT**: Replace the team member ID in the file:
```sql
-- Find this line and replace with YOUR team member ID:
WHERE tm.id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8';
```

This checks:
- ✅ Your user ID
- ✅ Your organization_id
- ✅ Your roles (admin/manager?)
- ✅ Team member's organization_id
- ✅ Do organizations match?
- ✅ Can `has_any_role()` see your roles?

**Share ALL the results!**

---

## 🎯 Most Likely Causes

### 1. Policies Didn't Apply Yet
```sql
-- Solution: Clear policy cache
SELECT pg_sleep(1);
```
Then refresh browser and try again.

### 2. You're Not Admin/Manager
```sql
-- Check user_roles table
SELECT * FROM user_roles WHERE user_id = auth.uid();
```
If empty or wrong role → Need to add admin role.

### 3. Organization Mismatch
```sql
-- Your org
SELECT organization_id FROM profiles WHERE user_id = auth.uid();

-- Team member's org
SELECT organization_id FROM team_members WHERE id = '<team_member_id>';
```
If different → Need to fix organization assignment.

### 4. has_any_role() Not Working
```sql
-- Test directly
SELECT has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[]);
```
If false but you ARE admin → Function has bug or user_roles is wrong.

---

## 🔧 Quick Fixes

### Fix 1: Add Admin Role (if missing)
```sql
INSERT INTO user_roles (user_id, role, organization_id)
SELECT 
  auth.uid(),
  'admin'::app_role,
  organization_id
FROM profiles
WHERE user_id = auth.uid()
ON CONFLICT (user_id, role, organization_id) DO NOTHING;
```

### Fix 2: Sync Team Member Organization
```sql
-- Make team member match your org
UPDATE team_members tm
SET organization_id = (
  SELECT organization_id 
  FROM profiles 
  WHERE user_id = auth.uid()
)
WHERE tm.id = '<team_member_id>'
  AND tm.organization_id IS NULL;
```

### Fix 3: Use Service Role Temporarily
In your code (`useTeamMemberDocuments.ts`), temporarily use service role:

```typescript
// At the top of the file
import { createClient } from '@supabase/supabase-js';

// Create service role client (bypasses RLS)
const supabaseServiceRole = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Need to add this to .env
);

// Then in uploadDocument, use:
const { data, error } = await supabaseServiceRole
  .from('team_member_certificates')
  .insert({...});
```

**⚠️ WARNING**: This bypasses ALL security - only for testing!

---

## 📊 Decision Tree

```
Upload fails with 403
│
├─ Run emergency-simple-policies.sql
│  │
│  ├─ Works? → Problem is policy logic
│  │           → Run diagnose-current-user.sql
│  │           → Check organizations match
│  │           → Check has_any_role() works
│  │
│  └─ Fails? → Problem is NOT policies
│              → Run check-table-structure.sql
│              → Check for triggers
│              → Check for constraints
│              → Check RLS is actually enabled
│
└─ Share results for next steps!
```

---

## 🚀 Action Plan

### RIGHT NOW:

1. **Run** `emergency-simple-policies.sql`
2. **Refresh** browser (`Ctrl + Shift + R`)
3. **Test** upload
4. **Report** result:
   - ✅ Works → Share `diagnose-current-user.sql` output
   - ❌ Fails → Share `check-table-structure.sql` output

---

## 💡 Remember

The `team_members` table works with the SAME pattern. So either:
- Your data is different (org_id mismatch)
- Your role is different (not admin/manager)
- Something else is blocking (trigger, constraint)

**Let's find out which one!** 🔍
