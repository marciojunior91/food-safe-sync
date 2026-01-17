# Quick Setup Checklist - People Module

## ✅ Complete These Steps in Order:

### **1. Apply Email Fix Migration** 
Run in Supabase SQL Editor: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new

Copy and run: `supabase/migrations/20260110_sync_profile_emails.sql`

**This fixes**: "No email" showing in auth user selector

---

### **2. Apply User Roles Migration**
Run in Supabase SQL Editor (same URL as above)

Copy and run: `supabase/migrations/20260110_fix_user_roles_relationships.sql`

**This fixes**: Missing cook and barista roles, relationship integrity

**Check output**: Should say "✓ All relationships are valid!"

---

### **3. Restart Dev Server**
The `.env` file was created with your Supabase credentials. Restart to load it:

```powershell
# Stop current server (Ctrl+C in terminal)
# Then run:
npm run dev
```

**This fixes**: "Supabase URL not configured" error

---

### **4. Test User Creation**

Open http://localhost:8080/people

**Test Steps:**
1. Click "Auth Users" tab
2. Click "Add User" button
3. Fill form:
   - Email: `test-cook@example.com`
   - Password: `TestCook123`
   - Display Name: `Test Cook`
   - Role: **Cook** (should now be available!)
4. Click "Create User"
5. Should see success message ✅

**Repeat for other roles**: barista, manager, leader_chef

---

### **5. Test Team Member Creation**

Still on People module:

1. Click "Team Members" tab
2. Click "Add Team Member" button
3. Check auth user dropdown:
   - Should show "Name - email" format
   - Should have actual emails (not "No email")
4. Fill form and create team member
5. Should see success ✅

---

## 🎯 Expected Results After All Steps:

- ✅ Emails show correctly in dropdowns
- ✅ All 5 roles available: admin, manager, leader_chef, cook, barista
- ✅ Can create auth users with any role
- ✅ Can link team members to auth users
- ✅ No "Supabase URL not configured" errors
- ✅ No "No email" in selectors

---

## 📋 Quick Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check all available roles
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype 
ORDER BY enumsortorder;
-- Should return: admin, manager, leader_chef, staff, cook, barista

-- Check your profile has email
SELECT user_id, display_name, email FROM profiles_with_email;

-- Validate relationships
SELECT * FROM validate_user_relationships();
-- Should return empty (no issues)
```

---

## 🚨 If Something Fails:

### **Migration Error**
- Check console output for specific error
- Ensure no typos in SQL
- Try running sections individually

### **Dev Server Won't Start**
- Check `.env` file exists
- Verify credentials in `.env` match env.txt
- Try: `npm install` then `npm run dev`

### **Still See "No Email"**
- Verify email migration ran successfully
- Check: `SELECT * FROM profiles_with_email;`
- Restart browser (hard refresh)

### **Role Not Available**
- Verify user_roles migration ran
- Check: `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'app_role'::regtype;`
- Restart dev server

---

## 📁 Files Reference

**Migrations** (in `supabase/migrations/`):
- `20260110_sync_profile_emails.sql` - Email fix
- `20260110_fix_user_roles_relationships.sql` - Roles fix

**Docs** (in `docs/`):
- `USER_ROLES_COMPLETE_FIX.md` - Full explanation
- `PROFILE_EMAIL_FIX.md` - Email issue details

**Code** (already updated):
- `src/components/people/CreateUserDialog.tsx`
- `src/components/people/CreateTeamMemberDialog.tsx`
- `.env` (created with your credentials)

---

**Time Estimate**: 5-10 minutes for all steps

**Next**: Once working, create 4-5 test users with different roles!
