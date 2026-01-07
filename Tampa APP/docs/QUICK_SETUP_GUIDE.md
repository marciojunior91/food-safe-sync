# 🚀 Quick Setup Guide - Onboarding System

**Date:** January 7, 2026  
**Time Required:** 10 minutes  
**Prerequisites:** Access to Supabase Dashboard

---

## ⚡ Quick Start (3 Steps)

### Step 1: Apply Database Migrations (5 min)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `imnecvcvhypnlvujajpn`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run Migration Script**
   - Open the file: `/supabase/APPLY_ONBOARDING_MIGRATIONS.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

4. **Verify Success**
   You should see output like:
   ```
   ✅ Onboarding migrations applied successfully!
   📊 Tables created: user_invitations, user_roles
   🔒 RLS policies: 6 policies created
   📝 Columns added to profiles and organizations
   ```

### Step 2: Regenerate TypeScript Types (2 min)

Run this command in PowerShell:

```powershell
npx supabase gen types typescript --project-id imnecvcvhypnlvujajpn > src/integrations/supabase/types.ts
```

Wait for it to complete. You should see the file `src/integrations/supabase/types.ts` updated.

### Step 3: Verify No TypeScript Errors (1 min)

```powershell
npm run build
```

If successful, you should see:
```
✓ built in XXXms
```

If there are errors, they should be significantly reduced or gone!

---

## 🧪 Test the Onboarding Flow (5 min)

### 1. Start Development Server

```powershell
npm run dev
```

### 2. Navigate to Onboarding

Open your browser to: `http://localhost:5173/onboarding`

> ⚠️ **Note:** You may need to add the route to your app router first!
> Check if `/onboarding` route exists in your routing configuration.

### 3. Complete the Flow

**Step 1 - Registration:**
- First Name: John
- Last Name: Doe
- Email: john.doe@example.com
- Password: SecurePass123!
- Confirm Password: SecurePass123!
- ✓ Accept Terms

**Step 2 - Company Info:**
- Business Type: Restaurant
- Business Name: Test Kitchen
- ABN: 12345678901 (example - won't validate checksum yet)
- Address: 123 Test St, Sydney, NSW 2000
- Phone: 0412 345 678

**Step 3 - Products:**
- Skip for now OR
- Add a test product manually

**Step 4 - Team Members:**
- Skip for now OR
- Add a test team member

**Step 5 - Invitations:**
- Skip for now OR
- Invite a test user

**Complete:**
- Click "Go to Dashboard"

### 4. Verify in Supabase Dashboard

**Check Authentication:**
- Go to: Authentication > Users
- You should see the new user: john.doe@example.com

**Check Database:**
- Go to: Table Editor
- Check `profiles` table - should have new record
- Check `organizations` table - should have new record
- Check `user_roles` table - should have 'owner' role

---

## 🎯 If You See Errors

### TypeScript Errors

If you still see TypeScript errors after regenerating types:

1. **Restart TypeScript Server:**
   - In VS Code: Ctrl+Shift+P
   - Type: "TypeScript: Restart TS Server"
   - Press Enter

2. **Check Types File:**
   - Open: `src/integrations/supabase/types.ts`
   - Search for: `user_invitations`
   - It should be present in the Tables interface

3. **Clear Cache:**
   ```powershell
   Remove-Item -Recurse -Force node_modules/.vite
   npm run dev
   ```

### Database Connection Errors

If onboarding fails with "network error":

1. **Check Environment Variables:**
   - File: `.env` or `.env.local`
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **Test Connection:**
   ```typescript
   // In browser console on http://localhost:5173
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```

### RLS Policy Errors

If you get "permission denied" errors:

1. **Temporarily Disable RLS** (for testing only):
   ```sql
   ALTER TABLE user_invitations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
   ```

2. **Re-enable after fixing:**
   ```sql
   ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
   ```

---

## 📋 Checklist

### Before Testing
- [ ] Migrations applied in Supabase Dashboard
- [ ] TypeScript types regenerated
- [ ] No TypeScript compilation errors
- [ ] Dev server running
- [ ] Environment variables configured

### During Testing
- [ ] Registration step works
- [ ] Company info step saves data
- [ ] Products step allows skip or add
- [ ] Team members step allows skip or add
- [ ] Invitations step allows skip or add
- [ ] Completion screen shows
- [ ] Redirects to dashboard

### After Testing
- [ ] User exists in Supabase Auth
- [ ] Profile created in database
- [ ] Organization created in database
- [ ] User role assigned (owner)
- [ ] No console errors
- [ ] No network errors

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'user_invitations'"

**Fix:** Types not regenerated properly.
```powershell
npx supabase gen types typescript --project-id imnecvcvhypnlvujajpn > src/integrations/supabase/types.ts
```

### Issue: "Column 'onboarding_completed' does not exist"

**Fix:** Migrations not applied.
- Re-run the SQL script in Supabase Dashboard
- Check Table Editor > profiles > should have new columns

### Issue: "Role 'owner' is not valid"

**Fix:** Types are stale.
- Regenerate types (see above)
- Restart TypeScript server in VS Code

### Issue: Email invitations not sending

**Expected:** This is normal! The Edge Function needs to be deployed:
```powershell
npx supabase functions deploy send-invitation --project-ref imnecvcvhypnlvujajpn
```

---

## 🚀 Deploy Edge Function (Optional)

If you want email invitations to work:

### 1. Deploy the Function

```powershell
npx supabase functions deploy send-invitation --project-ref imnecvcvhypnlvujajpn
```

### 2. Set Secrets (Required)

The Edge Function needs these environment variables:

```powershell
# These are automatically available in Supabase Edge Functions
# SUPABASE_URL - auto-injected
# SUPABASE_SERVICE_ROLE_KEY - auto-injected
```

No manual setup needed! Supabase injects these automatically.

### 3. Test the Function

After deployment, invitations will be sent via email automatically!

---

## ✅ Success Indicators

You've successfully set up onboarding when:

1. ✅ No TypeScript errors in project
2. ✅ Can complete all 5 onboarding steps
3. ✅ User appears in Supabase Auth
4. ✅ Data appears in database tables
5. ✅ Can redirect to dashboard after completion

---

## 📚 Reference Files

- **Migration SQL:** `/supabase/APPLY_ONBOARDING_MIGRATIONS.sql`
- **Database Functions:** `/src/lib/onboardingDb.ts`
- **React Hook:** `/src/hooks/useOnboardingDb.ts`
- **Main Page:** `/src/pages/Onboarding.tsx`
- **Edge Function:** `/supabase/functions/send-invitation/index.ts`

---

## 🎯 Next Steps After Setup

1. **Add Onboarding Route**
   - Add `/onboarding` to your router configuration
   - Make it accessible from landing/login page

2. **Test with Real Data**
   - Use valid Australian ABN (with checksum)
   - Import products via CSV
   - Create team members with PINs
   - Send invitation emails

3. **Build Invitation Acceptance**
   - Create `/accept-invitation` page
   - Implement token verification
   - Allow password setup for invited users

4. **Customize Branding**
   - Update logo in onboarding header
   - Customize email templates
   - Adjust colors/gradients

---

## 💡 Tips

- **Use Skip Options:** During testing, skip optional steps to speed up
- **Check Browser Console:** Look for any error messages
- **Monitor Network Tab:** See actual API calls to Supabase
- **Use Test Emails:** Use your own email to test invitations
- **Clear Browser Cache:** If you see old data/errors

---

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check browser console for errors
2. Check Supabase Dashboard > Logs
3. Review the documentation in `/docs/`
4. Look at the code comments in source files

---

**Ready to go!** Follow the 3 steps above and you'll have the onboarding system running in 10 minutes! 🚀
