# 🚀 QUICK DEPLOY GUIDE - Certificate Upload + Visual Identity

## ⚡ 3-Step Certificate Upload Fix

### Step 1: Storage Policies (2 min)
```sql
-- File: docs/sql-scripts/fix-bucket-storage-policies.sql
-- Run in Supabase SQL Editor
-- Creates storage.objects policies for team_member_documents bucket
```

### Step 2: User Data (2 min)
```sql
-- File: docs/sql-scripts/assign-roles-quick.sql
-- Run in Supabase SQL Editor
-- Assigns you to org + gives admin role
```

### Step 3: Table Policies (2 min)
```sql
-- File: docs/sql-scripts/COMPLETE_FIX_BOTH_TABLES.sql
-- Run in Supabase SQL Editor
-- Fixes team_members + team_member_certificates RLS
```

### Step 4: Test (1 min)
```bash
1. Refresh browser (Ctrl + Shift + R)
2. People → Edit Team Member → Documents
3. Upload file
4. ✅ Works!
```

---

## 🎨 Visual Identity - Already Applied!

### Light Mode: White + Orange
- Clean white backgrounds
- Vibrant Tampa Orange (#FF7328)
- Warm shadows with orange tint
- Professional yet energetic

### Dark Mode: Black + Orange Glow
- Deep black backgrounds
- Bright orange highlights
- Orange glow effects in shadows
- Modern & sophisticated

### Just refresh to see it! 🎨

---

## 📋 Quick Reference

### Files to Run (In Order)
1. `docs/sql-scripts/fix-bucket-storage-policies.sql`
2. `docs/sql-scripts/assign-roles-quick.sql`
3. `docs/sql-scripts/COMPLETE_FIX_BOTH_TABLES.sql`

### Documentation
- Full guide: `docs/STORAGE_POLICIES_MISSING.md`
- Theme details: `docs/VISUAL_IDENTITY_ORANGE_BLACK.md`
- Day summary: `docs/DAY_SUMMARY_2026_01_13.md`

### What Changed
- ✅ TFN formatting (nnn nnn nnn format)
- ✅ TFN label updated
- ✅ Active switch moved
- ✅ Document upload system created
- ✅ Storage bucket policies fixed
- ✅ RLS policies fixed
- ✅ Orange/Black theme applied

---

## 🔥 That's It!

**Total time**: ~9 minutes to deploy
**Result**: Working uploads + beautiful orange/black theme

**Go deploy! 🚀**
