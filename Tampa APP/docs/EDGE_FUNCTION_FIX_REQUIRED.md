# Edge Function Fix: User Creation Permission Error

## Problem

When trying to create a user, you get:
```
Error: Insufficient permissions. Only admins and managers can create users.
```

Even though you're logged in as an admin.

## Root Cause

The `create-user-with-credentials` edge function was checking for the role in the **profiles** table:
```typescript
// OLD - WRONG (profiles don't have a role column)
const { data: requestingProfile } = await supabaseAdmin
  .from("profiles")
  .select("role, organization_id")
  .eq("user_id", requestingUser.id)
  .single();

if (!requestingProfile || !["admin", "manager"].includes(requestingProfile.role)) {
  throw new Error("Insufficient permissions...");
}
```

But after our migration, roles are stored in the **user_roles** table, not profiles!

## Solution Applied

**Updated `create-user-with-credentials/index.ts`** to:

### 1. Check role from user_roles table
```typescript
// NEW - CORRECT
const { data: userRole, error: roleError } = await supabaseAdmin
  .from("user_roles")
  .select("role")
  .eq("user_id", requestingUser.id)
  .single();

if (!["admin", "manager"].includes(userRole.role)) {
  throw new Error("Insufficient permissions...");
}
```

### 2. Removed role from profile insert
```typescript
// Profiles don't have a role column anymore
.insert({
  user_id: authUser.user.id,
  email: email,
  display_name: display_name,
  // role: role_type, ← REMOVED
  organization_id: organization_id,
  ...
})
```

### 3. Added user_roles entry creation
```typescript
// Step 3: Create user_roles entry
const { error: userRoleError } = await supabaseAdmin
  .from("user_roles")
  .insert({
    user_id: authUser.user.id,
    role: role_type,
    created_at: new Date().toISOString(),
  });
```

### 4. Updated cleanup on error
Now deletes user_roles entry if team member creation fails.

## How to Deploy

**Option 1: Using Supabase CLI**
```powershell
cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
npx supabase functions deploy create-user-with-credentials --no-verify-jwt
```

**Option 2: Manual Deployment via Dashboard**
1. Go to: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/functions
2. Click on `create-user-with-credentials`
3. Click "Edit function"
4. Copy the entire contents of: `supabase/functions/create-user-with-credentials/index.ts`
5. Paste into the editor
6. Click "Deploy"

**Option 3: Using PowerShell (Fresh Terminal)**
1. Open NEW PowerShell window (not in VS Code)
2. Run:
   ```powershell
   cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
   npx supabase functions deploy create-user-with-credentials --no-verify-jwt
   ```

## Expected Deployment Output

```
Deploying Function create-user-with-credentials (project ref: imnecvcvhypnlvujajpn)
  + Deployed Function create-user-with-credentials
✓ Function deployed successfully
```

## After Deployment

1. **Refresh your browser** (to clear any cached errors)
2. **Try creating a user** again:
   - Go to People page
   - Click "Auth Users" → "Add User"
   - Fill in the form
   - Click "Create User"
3. ✅ Should now work!

## What This Fixes

- ✅ Permission check now uses `user_roles` table (correct location)
- ✅ Profile creation no longer tries to set non-existent `role` field
- ✅ `user_roles` entry is created for new users
- ✅ Proper cleanup on errors (deletes user_roles too)
- ✅ Better logging for debugging

## Files Modified

1. **`supabase/functions/create-user-with-credentials/index.ts`**
   - Lines 60-80: Updated permission check
   - Lines 115-130: Removed role from profile insert
   - Lines 135-150: Added user_roles creation step
   - Lines 175-185: Updated cleanup to include user_roles

---

**Status**: ✅ Code fixed, needs deployment  
**Priority**: HIGH - Blocks user creation  
**Estimated Time**: 2 minutes to deploy  
**Last Updated**: January 10, 2026
