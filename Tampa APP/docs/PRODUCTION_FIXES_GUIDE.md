# 🚨 Production Issues - Resolution Guide

**Date:** January 16, 2026  
**Branch:** main  
**Environment:** Production (Vercel)

## 📋 Issues Identified

### 1. **404 Database Errors** 
Tables/views don't exist in production:
- `prepared_items` 
- `waste_logs`
- `compliance_checks` 
- `efficiency_analytics` (view)

### 2. **TypeError in Components**
`Cannot read properties of undefined (reading 'length')`
- Caused by components trying to access data from missing tables
- Analytics and Inventory modules affected

### 3. **Wrong Logo**
- Production showing old logo
- New logo exists in `TAMPAAPP_10_11_RECIPES_FUNCIONALITY` branch: `public/tampa-logo.png`
- Need to merge to main branch

---

## 🔍 Root Cause Analysis

### Database Migrations Not Applied
Production database is missing migrations from October 2025:
- ✅ `20250821021540` - Creates `prepared_items` table (EXISTS locally)
- ❌ `20251006214310` - Creates labeling tables (NOT applied to production)
- ❌ `20251006215528` - Creates `waste_logs`, `compliance_checks` (NOT applied)
- ❌ `20251006215603` - Creates `efficiency_analytics` view (NOT applied)

**Key Missing Migration:**
```sql
-- 20251006215528_174a5289-c7c1-463c-80f7-f08802ce581b.sql
CREATE TABLE public.waste_logs (...);
CREATE TABLE public.compliance_checks (...);
CREATE VIEW public.efficiency_analytics AS ...;
```

### Branch Mismatch
- Production deployed from: `main` branch
- New features/logo exist in: `TAMPAAPP_10_11_RECIPES_FUNCIONALITY` branch
- **Logo file:** `public/tampa-logo.png` exists in feature branch, not in main

---

## ✅ Solution Steps

### **Step 1: Apply Missing Migrations to Production Database**

#### Option A: Via Supabase Dashboard (Recommended - 5 minutes)

1. **Login to Supabase Dashboard**
   ```
   https://app.supabase.com/project/imnecvcvhypnlvujajpn
   ```

2. **Navigate to SQL Editor**
   - Left sidebar → SQL Editor
   - Click "New Query"

3. **Run Migration: waste_logs & compliance_checks**
   
   Copy and paste the entire content from:
   ```
   supabase/migrations/20251006215528_174a5289-c7c1-463c-80f7-f08802ce581b.sql
   ```
   
   **Execute the query** ✅

4. **Run Migration: efficiency_analytics view**
   
   Copy and paste content from:
   ```
   supabase/migrations/20251006215603_843ab8b2-7de8-4d0e-af6b-cc7cf3a2442d.sql
   ```
   
   **Execute the query** ✅

5. **Verify Tables Created**
   
   Run this verification query:
   ```sql
   -- Check if tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('prepared_items', 'waste_logs', 'compliance_checks');
   
   -- Check if view exists
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name = 'efficiency_analytics';
   ```
   
   **Expected Result:** Should return 4 rows ✅

#### Option B: Via Supabase CLI (Advanced - 10 minutes)

1. **Install Supabase CLI** (if not installed)
   ```powershell
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```powershell
   supabase login
   ```

3. **Link to Production Project**
   ```powershell
   cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
   supabase link --project-ref imnecvcvhypnlvujajpn
   ```

4. **Apply Migrations**
   ```powershell
   supabase db push
   ```

5. **Verify Migration Status**
   ```powershell
   supabase migration list
   ```

---

### **Step 2: Merge Logo from Feature Branch**

#### Copy Logo to Main Branch

1. **Switch to feature branch**
   ```powershell
   cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
   git checkout TAMPAAPP_10_11_RECIPES_FUNCIONALITY
   ```

2. **Copy logo file**
   ```powershell
   # Logo already exists in public/ directory in feature branch
   # Just verify it's there
   Test-Path "public/tampa-logo.png"
   ```

3. **Switch to main branch**
   ```powershell
   git checkout main
   ```

4. **Cherry-pick the logo file**
   ```powershell
   # Option A: Copy manually from feature branch
   git checkout TAMPAAPP_10_11_RECIPES_FUNCIONALITY -- public/tampa-logo.png
   
   # Option B: If logo is in a specific commit, cherry-pick that commit
   git log TAMPAAPP_10_11_RECIPES_FUNCIONALITY --oneline --all -- public/tampa-logo.png
   # Then cherry-pick the commit hash
   ```

5. **Commit the logo**
   ```powershell
   git add public/tampa-logo.png
   git commit -m "feat: Add new Tampa logo to main branch"
   ```

6. **Push to main**
   ```powershell
   git push origin main
   ```

---

### **Step 3: Deploy to Production**

#### Trigger Vercel Redeployment

1. **Option A: Automatic (after git push)**
   - Vercel detects changes to `main` branch
   - Automatically triggers rebuild
   - Wait 3-5 minutes for deployment

2. **Option B: Manual via Vercel Dashboard**
   - Go to: https://vercel.com/marciojunior91/food-safe-sync
   - Click "Deployments" tab
   - Find latest deployment
   - Click "Redeploy" button
   - Select "Use existing Build Cache" ❌ (uncheck)
   - Click "Redeploy" ✅

3. **Wait for Build to Complete** (~5 minutes)
   - Monitor build logs in Vercel dashboard
   - Ensure no errors

---

### **Step 4: Verify Production**

#### Database Verification

1. **Test Analytics Page**
   ```
   https://your-production-url.vercel.app/analytics
   ```
   - Should load without 404 errors
   - Charts should render with data

2. **Test Inventory Page**
   ```
   https://your-production-url.vercel.app/inventory
   ```
   - Should load without TypeError
   - Waste logs should be accessible

#### Logo Verification

1. **Check Homepage**
   ```
   https://your-production-url.vercel.app/
   ```
   - Verify new Tampa logo displays correctly
   - Check both light and dark mode

2. **Inspect in DevTools**
   - Open Browser DevTools (F12)
   - Go to Network tab
   - Look for `tampa-logo.png` request
   - Should return **200 OK** (not 404)

---

## 🛡️ Prevention Strategy

### 1. **Migration Management**

Create a pre-deployment checklist:

```markdown
## Pre-Deployment Checklist
- [ ] Run local migrations: `supabase db reset`
- [ ] Verify all tables exist locally
- [ ] Export schema: `supabase db dump`
- [ ] Compare production vs local schema
- [ ] Apply missing migrations to production BEFORE deploying code
```

### 2. **Automated Migration Deployment**

Add to GitHub Actions or Vercel deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Apply Migrations
        run: |
          npm install -g supabase
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  
  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        # ... deployment steps
```

### 3. **Branch Strategy**

**Recommended Git Flow:**

```
main (production)
  └── develop (staging)
       └── feature branches (TAMPAAPP_10_11_RECIPES_FUNCIONALITY)
```

**Workflow:**
1. Develop features in feature branches
2. Merge to `develop` for testing
3. Merge to `main` only after full QA
4. Apply migrations BEFORE merging to main

---

## 📊 Impact Assessment

### Before Fix
- ❌ Analytics page: 404 errors
- ❌ Inventory page: TypeError crashes
- ❌ Logo: Wrong branding
- ❌ Database: Missing 3 tables + 1 view

### After Fix
- ✅ Analytics page: Fully functional
- ✅ Inventory page: No errors
- ✅ Logo: Correct Tampa branding
- ✅ Database: Complete schema

---

## 🚀 Quick Reference Commands

### Check Migration Status Locally
```powershell
cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
ls supabase/migrations | Select-Object -Last 10
```

### Verify Database Schema
```sql
-- Run in Supabase SQL Editor
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check Production Logs
```powershell
# In Vercel dashboard, or via CLI:
vercel logs https://your-production-url.vercel.app --follow
```

---

## 📞 Support Contacts

- **Supabase Dashboard:** https://app.supabase.com/project/imnecvcvhypnlvujajpn
- **Vercel Dashboard:** https://vercel.com/marciojunior91/food-safe-sync
- **GitHub Repo:** https://github.com/marciojunior91/food-safe-sync

---

## ✅ Completion Checklist

- [ ] Step 1: Migrations applied to production database
- [ ] Step 2: Logo merged to main branch
- [ ] Step 3: Production redeployed
- [ ] Step 4: All pages verified working
- [ ] Step 5: Australian client notified of fixes

**Estimated Total Time:** 20-30 minutes

