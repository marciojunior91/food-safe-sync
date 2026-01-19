📋 **FEED MODULE - QUICK FIX CHECKLIST**

## ✅ COMPLETED

1. **Background Theme Issue**: Fixed
   - Changed `bg-gray-50` → `bg-background` 
   - File: `src/pages/FeedModuleV2.tsx`
   - ✅ Theme switching now works

2. **RLS Migration Created**: Ready to apply
   - File: `supabase/migrations/20260118000001_fix_feed_posts_rls.sql`
   - Fixes: Team member selection pattern support
   - Updates: All feed table policies

---

## 🔴 ACTION REQUIRED (5 minutes)

### Apply the RLS Migration:

**Step 1**: Open the SQL file
```powershell
code supabase\migrations\20260118000001_fix_feed_posts_rls.sql
```

**Step 2**: Copy ALL the SQL content (Ctrl+A, Ctrl+C)

**Step 3**: Open Supabase Dashboard
- URL: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
- Navigate to: **SQL Editor** (left menu)
- Click: **New Query**

**Step 4**: Paste the SQL and Run
- Paste the copied SQL (Ctrl+V)
- Click: **RUN** button (or F5)
- Should see: "Success. No rows returned"

**Step 5**: Test in your app
- Go to: http://localhost:8080/feed-v2
- Try creating a post
- Should work! ✅

---

## 📝 What This Fixes

**Before**: 
```
❌ POST 403 Forbidden
❌ Error: new row violates row-level security policy
```

**After**:
```
✅ Posts created successfully
✅ Reactions work
✅ Comments work
✅ Theme background responds to theme changes
```

---

## 🎯 Why This Happened

Your app uses **shared tablet accounts** with **team member selection**:

1. User logs in: `cook@restaurant.com` ← auth.uid()
2. User selects: "João Silva" ← team_member UUID
3. Creates post as: João Silva ← author_id

Old policy checked: `author_id = auth.uid()` ❌  
(João's UUID ≠ cook@restaurant.com UUID)

New policy checks: `author_id IN (team members in my org)` ✅  
(João is a team member in the cook's organization)

---

## ⏭️ After Applying

Once the migration is applied, you can:

1. ✅ Create posts without errors
2. ✅ Continue with Sprint 3 (Comments)
3. ✅ Migrate features from old feed
4. ✅ Replace old feed route

---

**Time to fix**: ~5 minutes  
**Files to copy**: 1 SQL file  
**Where to paste**: Supabase Dashboard > SQL Editor

Let me know when done! 🚀
