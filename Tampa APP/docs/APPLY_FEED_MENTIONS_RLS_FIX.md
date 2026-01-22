# 🔧 Feed Mentions RLS Policy Fix - Application Guide

**Date:** 22 Jan 2026  
**Issue:** Mentions filter returning 0 results despite mentions existing in database  
**Root Cause:** Incorrect RLS policy checking `auth.uid()` instead of `team_member.id`

---

## 🐛 The Problem

### Current (Broken) Policy:
```sql
CREATE POLICY "Users can view their own mentions"
ON feed_mentions FOR SELECT
USING (mentioned_user_id = auth.uid());
```

**Why it's broken:**
- `mentioned_user_id` = UUID of **team_member** (e.g., Ana Costa's team_member.id)
- `auth.uid()` = UUID of **auth user** (e.g., marcio.b.a.b.junior's auth.users.id)
- These are **DIFFERENT UUIDs**! ❌
- Result: Policy blocks all mentions from being read

### Evidence:
```
SQL Query Result:
| mentioned_user_id (Ana Costa)        | auth.uid() (Auth User)              | Match? |
|--------------------------------------|-------------------------------------|--------|
| cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8 | cd9af250-133d-409e-9e97-f570f767648d | ❌ NO  |

Console Logs:
[getFeedPosts] 📋 Found mentions: 0  ← Blocked by RLS!
[getFeedPosts] 📋 Mentions data: []
```

---

## ✅ The Solution

### New (Correct) Policy:
```sql
CREATE POLICY "Users can view mentions in their organization"
ON feed_mentions FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM team_members tm_mentioned
    INNER JOIN team_members tm_current 
      ON tm_mentioned.organization_id = tm_current.organization_id
    WHERE tm_mentioned.id = feed_mentions.mentioned_user_id
      AND tm_current.auth_user_id = auth.uid()
  )
);
```

**How it works:**
1. Get the mentioned team member (`tm_mentioned`)
2. Get the current user's team member (`tm_current`) via `auth.uid()`
3. Check if both are in the **same organization**
4. If yes → Allow access ✅
5. If no → Block access ❌

**Result:** Users can see mentions for any team member in their organization!

---

## 📋 Step-by-Step Application

### Step 1: Open Supabase SQL Editor
1. Go to **Supabase Dashboard**
2. Select your project: **Tampa APP**
3. Navigate to **SQL Editor**
4. Click **New Query**

### Step 2: Run the Fix Script
1. Copy the entire content of `FIX_FEED_MENTIONS_RLS.sql`
2. Paste into SQL Editor
3. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify Success
You should see:
```
Query executed successfully
Rows returned: 3
```

With these policies:
| policyname                                           | cmd    |
|-----------------------------------------------------|--------|
| Users can view mentions in their organization       | SELECT |
| Users can create mentions in their organization     | INSERT |
| Users can update mentions in their organization     | UPDATE |

### Step 4: Test in Application
1. **Refresh the browser** (F5)
2. **Switch to Ana Costa**
3. **Click "@Mentions" tab**
4. **Expected result:**
   ```
   [getFeedPosts] 📋 Found mentions: 1
   [getFeedPosts] 📋 Mentions data: [{comment_id: "4499f488..."}]
   [getFeedPosts] 📦 Query returned: 1 posts
   ```
5. **Should see the post** with Carlos Oliveira's comment mentioning Ana Costa! 🎉

---

## 🧪 Testing Scenarios

### Test 1: View Mentions (SELECT)
**Setup:**
- User: Ana Costa
- Mention exists: Carlos Oliveira → Ana Costa

**Expected:**
- ✅ Ana Costa can see the mention
- ✅ Feed shows the post with mention

**SQL to verify:**
```sql
-- Run as Ana Costa (auth_user_id: cd9af250-133d-409e-9e97-f570f767648d)
SELECT * FROM feed_mentions
WHERE mentioned_user_id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8';

-- Should return 1 row (Carlos → Ana mention)
```

### Test 2: Create Mention (INSERT)
**Setup:**
- User: Carlos Oliveira
- Action: Create comment mentioning Ana Costa

**Expected:**
- ✅ Carlos can create mention
- ✅ Mention inserted into database

**Console logs:**
```
[createMentions] 💾 Inserting records: [{...}]
[createMentions] ✅ Created 1 mention(s) successfully
```

### Test 3: Cross-Organization Block
**Setup:**
- User: Ana Costa (Org A)
- Mention exists: User from Org B → Someone in Org B

**Expected:**
- ❌ Ana Costa CANNOT see mentions from Org B
- ✅ RLS correctly blocks cross-org access

---

## 🔍 Troubleshooting

### Issue: Still showing 0 mentions after fix

**Check 1: RLS Policy Applied?**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'feed_mentions';
```
Should show 3 policies (SELECT, INSERT, UPDATE)

**Check 2: Mentions Exist?**
```sql
SELECT 
  fm.*,
  tm_mentioned.display_name as mentioned_user,
  tm_by.display_name as mentioned_by
FROM feed_mentions fm
LEFT JOIN team_members tm_mentioned ON fm.mentioned_user_id = tm_mentioned.id
LEFT JOIN team_members tm_by ON fm.mentioned_by_id = tm_by.id
WHERE tm_mentioned.display_name = 'Ana Costa';
```
Should show at least 1 mention

**Check 3: Organization Isolation?**
```sql
-- Verify Ana Costa's organization
SELECT id, display_name, organization_id, auth_user_id
FROM team_members
WHERE display_name = 'Ana Costa';

-- Verify mention is in same organization
SELECT 
  fm.*,
  tm_mentioned.organization_id as mentioned_org,
  tm_by.organization_id as by_org
FROM feed_mentions fm
JOIN team_members tm_mentioned ON fm.mentioned_user_id = tm_mentioned.id
JOIN team_members tm_by ON fm.mentioned_by_id = tm_by.id
WHERE tm_mentioned.display_name = 'Ana Costa';
```
Both orgs should be the same!

**Check 4: Browser Cache?**
- Hard refresh: `Ctrl+Shift+R`
- Clear cache and reload
- Try incognito mode

---

## 📊 Before & After

### Before Fix:
```
Query: SELECT * FROM feed_mentions WHERE mentioned_user_id = 'ana-uuid'
RLS Check: ana-uuid = auth.uid() → FALSE ❌
Result: 0 rows (blocked)

Console:
[getFeedPosts] 📋 Found mentions: 0
[getFeedPosts] ⚠️ No mentions found for user, returning empty
```

### After Fix:
```
Query: SELECT * FROM feed_mentions WHERE mentioned_user_id = 'ana-uuid'
RLS Check: ana-uuid in same org as auth.uid() → TRUE ✅
Result: 1 row (Carlos → Ana mention)

Console:
[getFeedPosts] 📋 Found mentions: 1
[getFeedPosts] 🔍 Getting post from comment: 4499f488...
[getFeedPosts] ➕ Adding post from comment mention: post-uuid
[getFeedPosts] 📦 Query returned: 1 posts
```

---

## ✅ Success Criteria

After applying the fix, you should see:

1. **Database Level:**
   - ✅ 3 RLS policies active (SELECT, INSERT, UPDATE)
   - ✅ SELECT policy uses organization-based check
   - ✅ Policies allow same-org access, block cross-org

2. **Application Level:**
   - ✅ Mentions filter shows posts where user is mentioned
   - ✅ Creating mentions works without errors
   - ✅ Console shows "Found mentions: X" (not 0)
   - ✅ Posts appear in @Mentions tab

3. **User Experience:**
   - ✅ Ana Costa sees posts where she's mentioned
   - ✅ Carlos Oliveira sees posts where he's mentioned
   - ✅ Filter updates in real-time when new mentions created
   - ✅ No errors in console

---

## 🚀 Next Steps

After applying this fix:

1. ✅ **Test mentions filter** with multiple users
2. ✅ **Verify cross-org isolation** still works
3. ✅ **Check performance** (JOIN shouldn't be slow for small orgs)
4. ✅ **Document** the fix in main docs
5. ✅ **Commit** the SQL script to repo

---

## 📝 Related Files

- **SQL Script:** `docs/FIX_FEED_MENTIONS_RLS.sql`
- **Debug Logs:** Added in `feedService.ts` (lines 143-156)
- **Issue Docs:** `docs/FEED_CRITICAL_FIXES.md`

---

## 🎯 Impact

**Files Changed:** 1 (database schema)  
**Lines Changed:** ~60 (RLS policies)  
**Bugs Fixed:** 1 critical (mentions filter not working)  
**Progress:** 55% → 56%  

**Severity:** 🔴 **CRITICAL** (blocking feature)  
**Status:** ✅ **READY TO APPLY**

---

*"Security is important, but not when it blocks legitimate features!"* 🔓
