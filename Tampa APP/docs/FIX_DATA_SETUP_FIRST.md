# 🚨 CRITICAL: Data Setup Issues Found!

## The Problem

You have **TWO missing pieces of data**:

1. ❌ **No user roles** - Your `user_roles` table shows NULL (empty or RLS blocking)
2. ❌ **Can't see team members** - Either:
   - Your `profiles.organization_id` is NULL
   - Team member's `organization_id` doesn't match yours
   - Both!

**This is why ALL the policies failed** - you have no role and can't access team members!

---

## ✅ The Fix (2 Steps)

### Step 1: Fix Your Data

**Run this file**: `assign-roles-quick.sql`

This will:
- ✅ Assign you to an organization (creates one if needed)
- ✅ Give you admin role
- ✅ Update team members to match your org
- ✅ Fix user_roles RLS policies

### Step 2: Apply RLS Policies

**Run this file**: `COMPLETE_FIX_BOTH_TABLES.sql`

This will:
- ✅ Create proper team_members SELECT policy
- ✅ Create proper certificate policies
- ✅ Enable organization isolation

---

## 🚀 Step-by-Step Instructions

### 1. Fix Data (FIRST!)

```bash
1. Open Supabase SQL Editor
2. Copy ALL of assign-roles-quick.sql
3. Execute it
4. Check output - should show "✅ EMERGENCY FIX COMPLETE!"
```

**Expected output:**
```
BEFORE FIX:
Your user_id: <your-id>
Your org_id: NULL  ← This is the problem!
Your roles: NONE   ← This is also a problem!

=== ORGANIZATION CHECK ===
✅ Assigned you to existing org: <org-id>

=== TEAM MEMBERS UPDATE ===
Updated X team members to your org

AFTER FIX:
Your user_id: <your-id>
Your org_id: <org-id>     ← Now fixed!
Your roles: admin          ← Now fixed!
Can see team members: ✅ YES  ← Now fixed!
```

### 2. Apply Policies (SECOND!)

```bash
1. Stay in Supabase SQL Editor
2. Copy ALL of COMPLETE_FIX_BOTH_TABLES.sql
3. Execute it
4. Check output - should show policies created
```

### 3. Test Upload (THIRD!)

```bash
1. Refresh browser (Ctrl + Shift + R)
2. Go to People → Edit Team Member → Documents
3. Click "Attach Documents"
4. Select a file
5. Upload should work! ✅
```

---

## 🔍 Why This Happened

### The Bootstrap Problem

This is a classic "chicken and egg" problem:

```
RLS policies require organization_id to work
    ↓
But you need to INSERT user_roles to get admin access
    ↓
But user_roles has RLS enabled
    ↓
So you can't INSERT your role
    ↓
So you can't access anything!
```

### The Solution

We temporarily **DISABLE RLS** on `user_roles`, add your admin role, then **RE-ENABLE it** with proper policies.

---

## 📊 What Each Script Does

### `assign-roles-quick.sql`

1. **Disables RLS** on user_roles (temporary!)
2. **Assigns you** to an organization (creates if needed)
3. **Adds admin role** to your user
4. **Updates team members** to your org
5. **Re-enables RLS** with correct policies
6. **Verifies** everything works

### `COMPLETE_FIX_BOTH_TABLES.sql`

1. **Fixes team_members** SELECT policy (for FK checks)
2. **Creates certificate policies** (org isolation + role checks)
3. **Verifies** policies work
4. **Tests access** to team members

---

## ⚠️ Common Issues

### If assign-roles-quick.sql fails:

**Error: "organization_id does not exist"**
- Solution: Organizations table is empty - script will create one

**Error: "app_role does not exist"**
- Solution: Your database doesn't have the app_role enum type
- Run this first:
```sql
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'leader_chef', 'staff');
```

### If COMPLETE_FIX_BOTH_TABLES.sql fails:

**Error: "has_any_role does not exist"**
- Solution: Function missing from your database
- Check: `supabase/migrations/20251006205806_*.sql` for the function

---

## 🎯 Quick Diagnosis

Before running scripts, check these:

```sql
-- Do you have an org?
SELECT organization_id FROM profiles WHERE user_id = auth.uid();
-- Should return a UUID, not NULL

-- Do you have roles?
SELECT * FROM user_roles WHERE user_id = auth.uid();
-- Should return at least one row with 'admin'

-- Can you see team members?
SELECT COUNT(*) FROM team_members;
-- Should return > 0

-- Are orgs matching?
SELECT 
  p.organization_id as your_org,
  tm.organization_id as tm_org
FROM profiles p
CROSS JOIN team_members tm
WHERE p.user_id = auth.uid()
LIMIT 1;
-- Both should be the SAME UUID
```

---

## ✅ Success Checklist

After running both scripts:

- [ ] You have an organization_id in profiles
- [ ] You have 'admin' role in user_roles
- [ ] Team members have same organization_id as you
- [ ] Can SELECT from team_members table
- [ ] Policies exist on both tables
- [ ] Upload works without RLS errors

---

## 🎉 Next Steps

Once both scripts complete successfully:

1. ✅ Refresh browser
2. ✅ Test document upload
3. ✅ Verify file saves to storage
4. ✅ Verify record in database
5. ✅ Celebrate! 🎊

---

## 📞 If Still Broken

Run `diagnose-user-and-org.sql` and share ALL the output.

This will show us exactly what's wrong with your data setup.
