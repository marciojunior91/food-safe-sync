# 🔒 Fix: "new row violates row-level security policy"

## The Problem

The file uploaded to storage successfully, but creating the database record in `team_member_certificates` failed due to RLS policies blocking the INSERT.

## 🔍 Step 1: Diagnose the Issue

Run this SQL to understand what's wrong:

```sql
-- See file: diagnose-rls-issue.sql
```

This will show you:
1. Is RLS enabled?
2. What policies exist?
3. Your user's organization
4. Team member's organization
5. Do they match?

## ✅ Step 2: Fix the Policies

Run this SQL to create proper RLS policies:

```sql
-- See file: fix-team-member-certificates-rls.sql
```

This will:
1. Drop old/broken policies
2. Create new policies that allow:
   - **SELECT**: View certificates in your org
   - **INSERT**: Create certificates in your org ✅ (This fixes your issue!)
   - **UPDATE**: Edit certificates in your org
   - **DELETE**: Delete certificates (admin only)

## 🎯 What the INSERT Policy Does

The new INSERT policy checks:
```sql
-- Allow INSERT if:
-- 1. Team member exists
-- 2. Team member's organization_id matches your organization_id
-- 3. You're authenticated
```

This ensures users can only create certificates for team members in their own organization.

## 🧪 Step 3: Test Again

After running the fix script:
1. Refresh your browser (`Ctrl + Shift + R`)
2. Go to People → Edit Team Member → Documents
3. Try uploading again
4. Should work! 🎉

## ❓ Common Issues

### Issue 1: User has no organization_id
**Problem**: Your profile doesn't have an organization assigned

**Fix**:
```sql
-- Check your profile
SELECT user_id, organization_id FROM profiles WHERE user_id = auth.uid();

-- If organization_id is NULL, assign one:
UPDATE profiles 
SET organization_id = 'YOUR_ORG_ID_HERE'
WHERE user_id = auth.uid();
```

### Issue 2: Team member has no organization_id
**Problem**: The team member doesn't have an organization assigned

**Fix**:
```sql
-- Check team member
SELECT id, display_name, organization_id 
FROM team_members 
WHERE id = 'TEAM_MEMBER_ID_HERE';

-- If organization_id is NULL, assign one:
UPDATE team_members 
SET organization_id = 'YOUR_ORG_ID_HERE'
WHERE id = 'TEAM_MEMBER_ID_HERE';
```

### Issue 3: Different organizations
**Problem**: You and the team member are in different organizations

**Fix**: You can only upload documents for team members in YOUR organization. Either:
- Assign the team member to your organization, OR
- Have an admin upload the document

### Issue 4: No user_roles entry
**Problem**: You don't have a role assigned

**Fix**:
```sql
-- Check your role
SELECT user_id, role FROM user_roles WHERE user_id = auth.uid();

-- If no row exists, create one:
INSERT INTO user_roles (user_id, role, organization_id)
VALUES (auth.uid(), 'staff', 'YOUR_ORG_ID_HERE');
```

## 📋 Quick Fix Checklist

- [ ] Run `diagnose-rls-issue.sql` to see the problem
- [ ] Run `fix-team-member-certificates-rls.sql` to fix policies
- [ ] Verify you have an organization_id in profiles
- [ ] Verify team member has organization_id
- [ ] Verify they're the same organization
- [ ] Refresh browser
- [ ] Try upload again

## 🎉 Expected Result

After fixing:
- Upload should work completely
- File saved to storage ✅
- Record saved to database ✅
- Document appears in list ✅
- No RLS errors ✅

## 📞 Still Not Working?

If it still fails, run `diagnose-rls-issue.sql` and share the results. The output will show exactly where the mismatch is!
