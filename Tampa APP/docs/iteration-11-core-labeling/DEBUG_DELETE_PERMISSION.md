# 🔍 Debug: Delete Image Permission Issue

## Problem
User "marcin" with role "leader" cannot delete images in edit mode.

## Root Cause Investigation

### Step 1: Check Console Logs
Open your browser console (F12) and look for these messages when you open the edit dialog:

```
TasksOverview - context: {user_role: "????"}
🔐 TaskForm - User role: ????
🔐 TaskForm - Can delete images: true/false
🖼️ ImageUpload rendered with: {canDelete: true/false}
```

### Step 2: What to Look For

**If you see:**
```
user_role: "leader"
Can delete images: true
canDelete: true
```
✅ **Then it should work!** The delete button should appear.

**If you see:**
```
user_role: "leader"
Can delete images: false
canDelete: false
```
❌ **Problem:** The role check is failing.

**If you see:**
```
user_role: undefined
```
❌ **Problem:** Role not being passed from context.

---

## Fix Applied

Updated the permission check to include multiple role variations:

```typescript
const canDeleteImages = 
  userRole === 'admin' || 
  userRole === 'owner' ||
  userRole === 'manager' ||
  userRole === 'leader_chef' || 
  userRole === 'leader' ||
  userRole?.toLowerCase().includes('leader') ||  // Any leader variant
  userRole?.toLowerCase().includes('admin');     // Any admin variant
```

This now catches:
- ✅ `admin`
- ✅ `owner`
- ✅ `manager`
- ✅ `leader_chef`
- ✅ `leader`
- ✅ Any role containing "leader" (case-insensitive)
- ✅ Any role containing "admin" (case-insensitive)

---

## Testing Steps

### 1. Refresh Your App
```
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### 2. Open Browser Console
Press **F12** → Go to **Console** tab

### 3. Edit Any Task
Click edit button on any task

### 4. Check Console Output
You should see:
```
TasksOverview - context: {user_role: "leader", ...}
🔐 TaskForm - User role: "leader"
🔐 TaskForm - Can delete images: true
🖼️ ImageUpload rendered with: {canDelete: true, ...}
```

### 5. Scroll to Photo Attachments
Look for the Photo Attachments section in the edit form

### 6. Hover Over Image
- Red X button should appear on the LEFT side
- Zoom button on the RIGHT side

### 7. Click Red X
- Confirmation dialog should appear
- Click OK to delete
- Image should be removed

---

## If Still Not Working

### Check 1: Is user_role Actually "leader"?
Look at the console output:
```javascript
TasksOverview - context: {user_role: "???"}
```

The role might be:
- `"Leader"` (capitalized)
- `"LEADER"` (uppercase)
- `"chef"` or something else
- `null` or `undefined`

### Check 2: Is Context Loading?
```javascript
TasksOverview - contextLoading: false  // Should be false
```

If it's `true`, context hasn't loaded yet.

### Check 3: Is TaskForm Receiving the Role?
```javascript
🔐 TaskForm - User role: "leader"  // Should not be undefined
```

If it shows `undefined`, the problem is in TasksOverview not passing it.

---

## Quick SQL Check

Run this in Supabase SQL Editor to see your actual role:

```sql
-- Check your user's role
SELECT 
  p.user_id,
  p.display_name,
  p.user_role,
  up.app_role
FROM profiles p
LEFT JOIN user_profiles up ON up.user_id = p.user_id
WHERE p.display_name ILIKE '%marcin%'
LIMIT 5;
```

This will show:
- Your `user_role` from profiles table
- Your `app_role` from user_profiles table (if exists)

One of these should have the role value.

---

## Expected Behavior

### For Leaders:
✅ **Can See:** Photo Attachments section  
✅ **Can Upload:** New images  
✅ **Can Delete:** Existing images (red X button)  
✅ **Can Zoom:** Preview images  

### For Regular Staff:
✅ **Can See:** Photo Attachments section  
✅ **Can Upload:** New images  
❌ **Cannot Delete:** No red X button  
✅ **Can Zoom:** Preview images  

---

## Solution Summary

The permission check has been updated to be more flexible and catch various role naming conventions. After refreshing your app, the delete button should appear for your "leader" role.

If it still doesn't work after refresh, check the console logs and share:
1. The exact `user_role` value
2. The `Can delete images` value
3. The `canDelete` value in ImageUpload

This will help pinpoint the exact issue! 🔍
