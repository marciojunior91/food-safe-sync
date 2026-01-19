# Feed Module - Issues Fixed (January 18, 2026)

## Issues Identified

### 1. ❌ Theme Background Not Working
**Problem**: Feed page had hardcoded `bg-gray-50` background, not respecting theme changes.

**Fix**: ✅ Changed to `bg-background` (Tailwind/shadcn theme-aware class)

**File**: `src/pages/FeedModuleV2.tsx`
```tsx
// Before
<div className="min-h-screen bg-gray-50">

// After
<div className="min-h-screen bg-background">
```

---

### 2. ❌ Cannot Create Posts - RLS Policy Error
**Error**: 
```
POST 403 (Forbidden)
Error: new row violates row-level security policy for table "feed_posts"
```

**Root Cause**: 
The RLS policies were checking `auth.uid() = author_id`, but:
- `auth.uid()` = Authenticated user UUID (shared account like `cook@restaurant.com`)
- `author_id` = Team member UUID (e.g., João Silva's UUID)
- These are DIFFERENT values!

This app uses a **team member selection pattern**:
1. User logs in with shared account (Layer 1 authentication)
2. User selects their team member profile (Layer 2 identification)
3. All operations use the team_member UUID, not the auth user UUID

**Fix**: ✅ Updated RLS policies to allow operations on ANY team_member in the user's organization

**Migration File**: `supabase/migrations/20260118000001_fix_feed_posts_rls.sql`

### Updated Policies:

#### Before (Broken):
```sql
CREATE POLICY "Users can create posts in their organization"
  ON feed_posts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE id = auth.uid()  -- ❌ This will never match!
    )
    AND author_id = auth.uid()  -- ❌ This will never match!
  );
```

#### After (Fixed):
```sql
CREATE POLICY "Users can create posts as team members in their org"
  ON feed_posts FOR INSERT
  WITH CHECK (
    -- ✅ Check that author_id is a team_member in user's organization
    author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
    -- ✅ And organization_id matches team member's organization
    AND organization_id = (
      SELECT organization_id FROM team_members WHERE id = author_id
    )
  );
```

---

## How to Apply the RLS Fix

### Option 1: Supabase Dashboard (RECOMMENDED)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to: **Project > SQL Editor**
3. Click: **New Query**
4. Open file: `supabase/migrations/20260118000001_fix_feed_posts_rls.sql`
5. Copy the entire SQL content
6. Paste in SQL Editor
7. Click: **Run**
8. Verify: Should see "Success. No rows returned"

### Option 2: PowerShell Script

Run the helper script:
```powershell
.\docs\apply-feed-rls-fix.ps1
```

This will open the SQL file in VS Code for easy copy/paste to Supabase.

---

## Tables Updated

The following tables now have corrected RLS policies:

✅ **feed_posts** - Posts creation, update, delete  
✅ **feed_reactions** - Reaction creation and removal  
✅ **feed_comments** - Comment creation, update, delete  
✅ **feed_attachments** - Attachment upload and delete  
⚪ **feed_mentions** - Already correct (unchanged)

---

## Verification

After applying the migration, test:

1. **Create a post**: ✅ Should work without 403 error
2. **Add a reaction**: ✅ Should work
3. **Add a comment**: ✅ Should work
4. **Theme switch**: ✅ Background should change color

---

## Technical Details

### Why Team Member Selection Pattern?

This app uses shared tablet accounts for operational workflows:

**Scenario**: Restaurant kitchen with shared iPad
- **Shared Account**: `cook@restaurant.com` (one login for all cooks)
- **Team Members**: João, Maria, Pedro (individual profiles)
- **Workflow**: 
  1. Open app (already logged in as `cook@restaurant.com`)
  2. Select "João Silva" from team member list
  3. Create post as João Silva
  4. João's name appears on the post, not "cook@restaurant.com"

### Security Model:

- ✅ Organization isolation maintained
- ✅ Users can only act as team_members in their organization
- ✅ Prevents cross-organization data access
- ✅ Audit trail: Operations tracked by team_member ID

---

## Status

- [x] Background theme fixed
- [x] RLS policies migration created
- [ ] **ACTION REQUIRED**: Apply migration in Supabase Dashboard
- [ ] Verify posts can be created
- [ ] Ready for Sprint 3 (Comments system)

---

## Next Steps

Once the RLS migration is applied:

1. Test creating posts in `/feed-v2`
2. Verify reactions work
3. Verify theme switching works
4. Proceed with **Sprint 3**: Comments System
5. Then migrate old feed features to new module
6. Replace `/feed` route with new module

---

**Created**: January 18, 2026  
**Status**: Fixes ready, awaiting migration application  
**Priority**: 🔴 HIGH - Blocks post creation
