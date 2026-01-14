# 🎯 ROOT CAUSE FOUND!

## The Real Problem

**Even with RLS DISABLED on `team_member_certificates`, you still get the error!**

This proves the error is **NOT** coming from `team_member_certificates` itself.

---

## 🔍 What's Really Happening

### The FK Constraint Check

When you INSERT into `team_member_certificates`:

```sql
INSERT INTO team_member_certificates (
  team_member_id,  -- This is a Foreign Key!
  ...
) VALUES (
  'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8',
  ...
);
```

PostgreSQL **must verify the FK** exists:

```sql
-- PostgreSQL internally runs this:
SELECT 1 FROM team_members 
WHERE id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8';
```

**BUT** `team_members` has **RLS enabled!**

If the RLS policy on `team_members` blocks you from seeing that team member, the FK check fails with:

```
"new row violates row-level security policy"
```

---

## 🎯 The Solution

### Fix the `team_members` SELECT policy!

The policy must allow you to SELECT the team member for FK checks to work.

**Run this file**: `COMPLETE_FIX_BOTH_TABLES.sql`

This does 3 things:

1. **Fixes `team_members` SELECT policy** - Allows org-based access
2. **Re-enables RLS** on `team_member_certificates`
3. **Creates proper certificate policies** - With org isolation and role checks

---

## 📊 Why This Happens

### FK Constraint Flow

```
You try to INSERT
    ↓
PostgreSQL checks FK (team_member_id references team_members.id)
    ↓
PostgreSQL runs: SELECT FROM team_members WHERE id = ?
    ↓
team_members has RLS ENABLED
    ↓
RLS policy blocks the SELECT
    ↓
FK check fails → Error: "violates row-level security policy"
```

### The Fix

```
Fix team_members SELECT policy to allow org-based access
    ↓
You can now SELECT team members in your org
    ↓
FK check succeeds
    ↓
INSERT works! ✅
```

---

## 🚀 Deploy the Fix

### Step 1: Run the SQL

```bash
1. Open Supabase SQL Editor
2. Copy ALL of COMPLETE_FIX_BOTH_TABLES.sql
3. Execute it
```

### Step 2: Verify

The script will show:
```
✅ COMPLETE FIX APPLIED!

📋 What was fixed:
  1. team_members SELECT policy - allows org-based access
  2. team_member_certificates RLS enabled
  3. All certificate policies created with org isolation

🔐 Security:
  ✅ Organization isolation on both tables
  ✅ Admin/Manager only for certificate modifications
  ✅ FK constraints now work (can see referenced team members)
```

### Step 3: Test

1. **Refresh browser** (`Ctrl + Shift + R`)
2. Try uploading a certificate
3. Should work now! ✅

---

## 🔐 Security Model

After the fix:

### team_members Table
- **SELECT**: Any authenticated user can view team members **in their org**
- **INSERT/UPDATE/DELETE**: Still restricted to admin/manager (unchanged)

### team_member_certificates Table
- **SELECT**: View certificates for team members **in your org**
- **INSERT**: Admin/Manager can create certificates **in their org**
- **UPDATE**: Admin/Manager can edit certificates **in their org**
- **DELETE**: Admin/Manager can delete certificates **in their org**

**Both tables maintain organization isolation!**

---

## 📚 Technical Details

### The Problem Code

```typescript
// In useTeamMemberDocuments.ts
const { data, error } = await supabase
  .from('team_member_certificates')
  .insert({
    team_member_id: memberId,  // ← FK to team_members.id
    // ...
  });
```

### What PostgreSQL Does

```sql
-- Step 1: Check FK constraint
SELECT 1 FROM team_members WHERE id = 'xxx';  -- ← RLS blocks this!

-- Step 2: If FK check passes, do the INSERT
INSERT INTO team_member_certificates (...);   -- ← Never gets here
```

### The Fix

```sql
-- Allow SELECT on team_members for org members
CREATE POLICY "view_team_members_in_org"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

Now the FK check can succeed!

---

## ✅ Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| RLS error on INSERT | FK constraint checks `team_members` | Fix `team_members` SELECT policy |
| Can't see team member | RLS policy too restrictive | Allow org-based SELECT |
| Certificate upload fails | Can't validate FK | Allow FK validation via SELECT |

**Bottom line**: The problem was `team_members` RLS, not `team_member_certificates`!

---

## 🎉 Next Steps

1. ✅ Run `COMPLETE_FIX_BOTH_TABLES.sql`
2. ✅ Refresh browser
3. ✅ Test upload
4. ✅ Celebrate! 🎊

This is the **correct, production-ready** solution! 🚀
