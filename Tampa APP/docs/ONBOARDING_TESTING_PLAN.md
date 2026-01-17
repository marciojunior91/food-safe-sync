# 🧪 Onboarding Flow - Testing Plan

**Date**: January 7, 2026  
**Status**: Ready for Testing  
**Est. Time**: 30-45 minutes  
**Prerequisites**: ✅ All migrations applied, ✅ Types generated, ✅ Edge Function deployed

---

## 🎯 Testing Objectives

1. **Verify End-to-End Flow**: Complete all 5 steps successfully
2. **Test Database Integration**: Ensure records are created correctly
3. **Validate Email Sending**: Check Edge Function executes
4. **Test Error Handling**: Simulate errors and verify graceful handling
5. **Verify Skip Options**: Test optional steps (products, team, invitations)
6. **Check Navigation**: Ensure proper routing after completion

---

## 📋 Pre-Testing Checklist

### ✅ Environment Setup
- [x] Database migrations applied successfully
- [x] TypeScript types regenerated
- [x] Build passes with no errors
- [x] Edge Function deployed
- [ ] Development server running (`npm run dev`)
- [ ] Supabase dashboard open for monitoring

### ✅ Test Data Prepared
Prepare the following test data:

**Company Information:**
- Company Name: "Test Café MVP"
- Business Type: café
- ABN: 51824753556 (valid test ABN)
- Address: "123 Test St, Sydney, NSW, 2000"

**Test Products:** (CSV or manual entry)
```csv
name,category,allergens,storage_temp
Test Coffee,Beverage,Milk,5
Test Sandwich,Food,Gluten|Eggs,2-4
```

**Team Members:**
- Name: "John Test"
- Role: leader_chef
- PIN: 1234

**Email Invitations:**
- Email: your-test-email@example.com
- Role: manager
- Message: "Welcome to the test!"

---

## 🧪 Test Scenarios

### Scenario 1: Complete Happy Path
**Goal**: Complete all 5 steps with valid data

#### Step 1: Registration
1. Navigate to `/onboarding` (or trigger onboarding flow)
2. Enter test email: `test-owner-${Date.now()}@example.com`
3. Enter password: `TestPass123!@#`
4. Confirm password: `TestPass123!@#`
5. Accept terms
6. Click "Create Account"

**Expected**:
- ✅ User created in Supabase Auth
- ✅ Profile record created
- ✅ No errors displayed
- ✅ Advances to Step 2

**Verify in Supabase Dashboard**:
- Check `auth.users` table for new user
- Check `profiles` table for new profile record

#### Step 2: Company Information
1. Fill in company details:
   - Company Name: "Test Café MVP"
   - Business Type: café
   - ABN: 51824753556
   - Phone: 0412345678
   - Address: "123 Test St"
   - City: "Sydney"
   - State: NSW
   - Postcode: 2000
2. Click "Continue"

**Expected**:
- ✅ Organization created
- ✅ User assigned 'owner' role
- ✅ Advances to Step 3

**Verify in Supabase Dashboard**:
- Check `organizations` table for new org
- Check `user_roles` table for owner role assignment
- Verify `organization_id` populated in `profiles`

#### Step 3: Products/Recipes
1. Option A: Upload CSV file (if prepared)
2. Option B: Click "Skip for Now"
3. Click "Continue" or "Skip for Now"

**Expected**:
- ✅ If CSV: Products created in database
- ✅ If skipped: No products created (OK)
- ✅ Advances to Step 4

**Verify in Supabase Dashboard** (if imported):
- Check `products` or `recipes` table for new entries
- Verify `organization_id` matches

#### Step 4: Team Members
1. Click "Add Team Member"
2. Fill in:
   - Name: "John Test"
   - Role: leader_chef
   - PIN: 1234
3. Click "Add"
4. See team member in list
5. Click "Continue" or "Skip for Now"

**Expected**:
- ✅ Team member created with hashed PIN
- ✅ Team member visible in list
- ✅ Advances to Step 5

**Verify in Supabase Dashboard**:
- Check `team_members` table for new entry
- Verify PIN is hashed (should be 64-char hex string)
- Verify `organization_id` matches

#### Step 5: User Invitations
1. Click "Add Invitation"
2. Fill in:
   - Email: test-invite@example.com
   - Role: manager
   - Personal Message: "Welcome to Test Café!"
3. Click "Add"
4. See invitation in list
5. Click "Complete Onboarding"

**Expected**:
- ✅ Success toast appears
- ✅ Loading overlay shows during submission
- ✅ Redirects to dashboard (or shows success message)

**Verify in Supabase Dashboard**:
- Check `user_invitations` table for new invitation
- Verify token is generated
- Verify expires_at is 7 days from now
- Verify status is 'pending'

**Verify Edge Function** (check email):
- Check Supabase Functions logs for execution
- If configured, check recipient inbox for email
- Verify email contains invitation link with token

---

### Scenario 2: Minimal Path (Skip Everything Possible)
**Goal**: Complete onboarding with only required steps

1. **Step 1**: Register (required)
2. **Step 2**: Company info (required)
3. **Step 3**: Click "Skip for Now"
4. **Step 4**: Click "Skip for Now"
5. **Step 5**: Click "Skip for Now" → "Complete Onboarding"

**Expected**:
- ✅ Only user + organization + owner role created
- ✅ No products, team members, or invitations
- ✅ Completes successfully

---

### Scenario 3: Error Handling
**Goal**: Verify errors are caught and displayed

#### Test 3.1: Duplicate Email (Step 1)
1. Try to register with existing email
2. **Expected**: Error message displayed, does not advance

#### Test 3.2: Invalid ABN (Step 2)
1. Enter invalid ABN: "12345"
2. **Expected**: Validation error before submission

#### Test 3.3: Network Error Simulation
1. Disconnect internet during step submission
2. **Expected**: Error message shown, can retry

---

### Scenario 4: Back Navigation
**Goal**: Verify users can go back and modify data

1. Complete Steps 1-3
2. Click "Back" on Step 4
3. Modify product data on Step 3
4. Click "Continue"
5. **Expected**: Changes saved, can continue forward

---

## 🐛 Common Issues to Watch For

### Issue: "Column does not exist" error
- **Cause**: Types not regenerated after migration
- **Fix**: Run `npx supabase gen types typescript --project-id imnecvcvhypnlvujajpn > src/integrations/supabase/types.ts`

### Issue: "User not authorized" error
- **Cause**: RLS policy blocking operation
- **Fix**: Check RLS policies, ensure user has correct role

### Issue: "Edge Function not found"
- **Cause**: Function not deployed
- **Fix**: Run `npx supabase functions deploy send-invitation --project-ref imnecvcvhypnlvujajpn`

### Issue: Email not received
- **Possible Causes**:
  1. Edge Function not configured with service role key
  2. Email service not set up in Supabase
  3. Email in spam folder
- **Fix**: Check Supabase Functions logs, verify SMTP settings

---

## 📊 Success Criteria

### Must Pass ✅
- [ ] Can register new user
- [ ] Can create organization
- [ ] Owner role assigned correctly
- [ ] Can skip optional steps
- [ ] Onboarding completes without errors
- [ ] Redirects to dashboard after completion
- [ ] Database records created with correct organization_id
- [ ] Build has no TypeScript errors

### Should Pass ✅
- [ ] Can import products via CSV
- [ ] Can create team members with PINs
- [ ] Can send email invitations
- [ ] Edge Function executes successfully
- [ ] Error messages display correctly
- [ ] Back navigation works

### Nice to Have ✅
- [ ] Email invitations are received and formatted beautifully
- [ ] Loading states are smooth and responsive
- [ ] Success animations are delightful
- [ ] Form validation is instant and helpful

---

## 🔍 Monitoring During Tests

### Supabase Dashboard - Things to Watch
1. **Authentication > Users**: New users appearing
2. **Table Editor > profiles**: Profile records with organization_id
3. **Table Editor > organizations**: New organizations with all fields
4. **Table Editor > user_roles**: Owner roles assigned
5. **Table Editor > team_members**: Team members with hashed PINs
6. **Table Editor > user_invitations**: Invitations with tokens
7. **Functions > send-invitation > Logs**: Function execution logs
8. **Database > Policies**: RLS policies not blocking operations

### Browser DevTools - Things to Watch
1. **Console**: No JavaScript errors
2. **Network**: All API calls returning 200/201
3. **Application > Local Storage**: Supabase auth tokens present
4. **Network > Response**: Check for error messages in API responses

---

## 📝 Test Execution Checklist

### Before Testing
- [ ] Pull latest code
- [ ] Run `npm install` (if dependencies changed)
- [ ] Run `npm run build` to verify no errors
- [ ] Start dev server: `npm run dev`
- [ ] Open Supabase dashboard in another tab
- [ ] Clear browser cache/cookies (for fresh test)

### During Testing
- [ ] Take screenshots of each step
- [ ] Note any error messages
- [ ] Check Supabase dashboard after each step
- [ ] Monitor browser console for errors
- [ ] Test both happy path and error scenarios

### After Testing
- [ ] Document all bugs found
- [ ] Rate UX/UI on scale of 1-10
- [ ] Note performance issues
- [ ] Verify all database records are correct
- [ ] Clean up test data (or mark for cleanup)

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Mark Item #3 as 100% complete
2. Update MVP Sprint Plan
3. Move to Item #4: PeopleModule Enhancements
4. Celebrate! 🎉

### If Issues Found 🐛
1. Create issue list with priorities
2. Fix critical bugs immediately
3. Schedule medium/low priority fixes
4. Re-test after fixes

---

## 🚀 Quick Start Command

```powershell
# Start development server
npm run dev

# Open in browser
# Navigate to: http://localhost:5173/onboarding
# (Or wherever your onboarding route is)

# In another terminal, watch Supabase logs (optional)
npx supabase functions logs send-invitation --project-ref imnecvcvhypnlvujajpn
```

---

**Ready to test!** 🧪  
Let's make sure this onboarding flow is 🔥 before moving to the next item!
