# Quick Migration Instructions

## ⚠️ IMPORTANT: Run These In Order!

### Step 1: Run Part 1 FIRST

**File**: `supabase/migrations/20260110_fix_user_roles_relationships_PART1_ONLY.sql`

1. Open Supabase SQL Editor
2. Copy ALL contents of the file above
3. Paste and RUN
4. ✅ Verify you see: "Added cook role" and "Added barista role"

---

### Step 2: STOP! Open New SQL Tab

**Before Part 2**: Click "New query" or refresh the page to start a fresh transaction.

---

### Step 3: Run Part 2 SECOND

**File**: `supabase/migrations/20260110_fix_user_roles_relationships_part2.sql`

1. In the NEW SQL Editor tab
2. Copy ALL contents of the file above
3. Paste and RUN
4. ✅ Verify you see: "Added constraint: ONE role per user" and "All relationships are valid!"

---

## Why Two Parts?

PostgreSQL requires enum values to be **committed** before they can be used. 

- **Part 1**: Adds enum values → commits
- **Part 2**: Uses those enum values → works! ✅

## Files Summary

| File | Purpose | When |
|------|---------|------|
| `20260110_fix_user_roles_relationships_PART1_ONLY.sql` | Add enum values | Run FIRST |
| `20260110_fix_user_roles_relationships_part2.sql` | Update functions & data | Run SECOND (new tab) |
| ~~`20260110_fix_user_roles_relationships.sql`~~ | ❌ Old file (had both parts together) | DON'T USE |

---

**Created**: January 10, 2026  
**Status**: Ready to run!
