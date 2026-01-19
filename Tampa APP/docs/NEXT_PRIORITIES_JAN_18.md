# 🎯 NEXT PRIORITIES - Feed Module Complete, What's Next?

**Date:** January 18, 2026  
**Context:** Feed Module V2 with Posts, Reactions & Comments is now **100% FUNCTIONAL**!

---

## ✅ JUST COMPLETED

### Feed Module V2 - DONE! 🎉
- ✅ Posts creation with role-based access
- ✅ Reactions system with emoji picker
- ✅ Comments with threading
- ✅ @Mentions with autocomplete
- ✅ Real-time updates (Supabase subscriptions)
- ✅ **RLS Policies Fixed** for all feed tables

**Status:** Production-ready, fully tested ✅

---

## 🔴 CRITICAL PRIORITY (Do These First)

### 1. Database Migrations - BLOCKED ⏸️
**Priority:** 🔴 CRITICAL  
**Time:** 5 minutes (user action)  
**Blocker:** NULL values in `routine_tasks.team_member_id`

#### Action Required:
You need to run ONE SQL script to fix NULL team member assignments:

```sql
-- File: docs/fix-null-team-member-tasks.sql
-- Option 3 (Recommended): Auto-assign to first admin
```

**Why Critical:**
- Blocks all future migrations
- Data integrity issue
- Makes `assigned_to` field mandatory (prevents future NULLs)

**Next Steps:**
1. Open Supabase SQL Editor
2. Run `docs/fix-null-team-member-tasks.sql` (Option 3)
3. Apply migration `20260115000001_make_assigned_to_mandatory.sql`
4. Apply migration `20260115000002_task_activity_tracking.sql`

**Impact:** All routine tasks must have someone assigned → Better accountability

---

### 2. RLS Security Audit 🔒
**Priority:** 🔴 CRITICAL  
**Time:** 4-6 hours  
**Reason:** Security vulnerability - organization data isolation

#### Tables Needing RLS Review:
- ❌ `recipes` (HIGH - contains sensitive business data)
- ❌ `products` (HIGH - contains proprietary info)
- ❌ `team_members` (CRITICAL - PII data)
- ❌ `user_roles` (CRITICAL - access control)
- ❌ `knowledge_base_topics` (MEDIUM)
- ❌ `training_materials` (MEDIUM)
- ❌ `compliance_reports` (HIGH - regulatory data)

#### What We've Already Fixed:
- ✅ `feed_posts`, `feed_reactions`, `feed_comments`, `feed_mentions`, `feed_attachments`
- ✅ `label_categories`, `label_subcategories`
- ✅ `routine_tasks`

**Test Plan:**
1. Create 2 test organizations
2. Try to access other org's data
3. Document any leaks
4. Apply fixes

**Reference:** Same pattern we used for feed tables → check `user_roles` instead of direct `team_members.id = auth.uid()`

---

## 🟠 HIGH PRIORITY (After Critical Items)

### 3. Routine Tasks - Phase 2 Testing 🚧
**Priority:** 🟠 HIGH  
**Time:** 2-3 hours  
**Status:** 90% complete, needs testing

#### Features to Test:
- [ ] Calendar date picker (navigate months)
- [ ] Mandatory assigned field (try creating without assignment)
- [ ] Activity history timeline (who did what)
- [ ] Recurrence patterns (daily/weekly/monthly)
- [ ] Custom task type ("Others" field)

#### Recurring Tasks - Phase 2:
- [ ] Edge Function for auto-generation (needs Supabase Functions)
- [ ] Cron job (daily at midnight)
- [ ] Test all recurrence patterns
- [ ] UI to show "Next 7 days" schedule

**Blocker:** Needs migrations applied first (#1 above)

---

### 4. Expiring Soon Module Enhancements 📦
**Priority:** 🟠 HIGH  
**Time:** 8-10 hours  
**Status:** 0% (not started)

#### Features Needed:
1. **List View with Row Ordering**
   - Drag-and-drop to reorder items
   - Manual expiry date adjustment
   
2. **Checkbox Selection System**
   - Multi-select items
   - Bulk actions (extend date, discard)
   
3. **End Label Life-Cycle**
   - "Discard" button
   - Mark items as disposed
   - Audit trail
   
4. **QR Code Scanning**
   - Mobile camera access
   - Scan label QR codes
   - Quick lookup
   
5. **Alert System**
   - Count items expiring today/tomorrow/this week
   - Visual badges
   - Email notifications (optional)

**Reference:** `docs/MVP_SPRINT_PLAN_JAN_15.md` Section 7

---

### 5. Stripe Webhook Testing 💳
**Priority:** 🟠 HIGH (Revenue-critical)  
**Time:** 4-6 hours  
**Status:** 60% (UI complete, backend needs testing)

#### Remaining Tasks:
- [ ] Test subscription creation webhook
- [ ] Test payment success/failure
- [ ] Test subscription cancellation
- [ ] Test subscription renewal
- [ ] Handle webhook failures gracefully
- [ ] Add webhook logging

**Why Important:** Without this, billing doesn't work correctly!

---

### 6. Reports & Compliance Module 📊
**Priority:** 🟠 HIGH  
**Time:** 12-16 hours  
**Status:** 0% (not started)

#### Core Features:
1. **Daily Temperature Logs**
   - Fridge/freezer temps
   - Digital signatures
   - Compliance tracking
   
2. **Cleaning Schedules**
   - Deep clean checklist
   - Photo evidence
   - Scheduled recurrence
   
3. **Incident Reports**
   - Food safety incidents
   - Customer complaints
   - Resolution tracking
   
4. **Audit Reports**
   - Generate compliance PDFs
   - Export to health inspector
   - Historical records

**Business Value:** Required for food safety regulations!

---

## 🟡 MEDIUM PRIORITY (Nice to Have)

### 7. Knowledge Base Module 📚
**Priority:** 🟡 MEDIUM  
**Time:** 10-12 hours  
**Status:** 0% (needs design decisions)

#### Features:
- [ ] Topic categories (Recipes, Procedures, Safety)
- [ ] Article editor (rich text)
- [ ] Search functionality
- [ ] Attachments (PDFs, images)
- [ ] Version history
- [ ] Role-based access (admin-only editing)

**Business Value:** Centralize restaurant knowledge

---

### 8. Training Center Module 🎓
**Priority:** 🟡 MEDIUM  
**Time:** 12-16 hours  
**Status:** 0% (content creation needed)

#### Features:
- [ ] Training courses (Food Safety, Operations)
- [ ] Video lessons
- [ ] Quizzes/assessments
- [ ] Completion certificates
- [ ] Progress tracking
- [ ] Mandatory training workflows

**Business Value:** Onboard new staff faster

---

### 9. Settings & Configuration ⚙️
**Priority:** 🟡 MEDIUM  
**Time:** 6-8 hours  
**Status:** 50% (basic settings exist)

#### Polish Needed:
- [ ] Organization settings UI
- [ ] User preferences (theme, language)
- [ ] Notification preferences
- [ ] Team permissions matrix
- [ ] API keys management
- [ ] Backup/restore options

---

## 🟢 LOW PRIORITY (Post-MVP)

### 10. Labelling System Polish 🏷️
**Priority:** 🟢 LOW  
**Time:** 2-4 hours  
**Status:** 95% complete

#### Minor Improvements:
- [ ] Multi-printer support (select printer per label)
- [ ] Shopping cart print queue (print multiple at once)
- [ ] Print history & reprint
- [ ] Barcode scanner integration

---

### 11. Advanced Features 🚀
**Priority:** 🟢 LOW  
**Time:** Variable

#### Future Enhancements:
- [ ] Mobile app (React Native)
- [ ] Inventory management integration
- [ ] POS system integration
- [ ] Analytics dashboard (most printed products, etc.)
- [ ] Advanced search/filters
- [ ] Bulk operations
- [ ] Dark mode toggle

---

## 📋 RECOMMENDED ORDER OF EXECUTION

### Week 1: Critical Security
1. ✅ **Fix NULL team members** (5 mins) → **DO THIS NOW!**
2. ✅ **Apply migrations** (10 mins)
3. **RLS Audit for all tables** (4-6 hours)
4. **Test organization isolation** (2 hours)

### Week 2: Core Modules
5. **Test Routine Tasks Phase 2** (2-3 hours)
6. **Recurring Tasks Edge Function** (4-6 hours)
7. **Expiring Soon Module** (8-10 hours)

### Week 3: Revenue & Compliance
8. **Stripe Webhook Testing** (4-6 hours)
9. **Reports & Compliance Module** (12-16 hours)

### Week 4: Enhancements
10. **Knowledge Base** (10-12 hours)
11. **Settings Polish** (6-8 hours)

### Future: Post-MVP
12. **Training Center** (12-16 hours)
13. **Advanced Features** (ongoing)

---

## 🎯 IMMEDIATE NEXT STEP

**What to do RIGHT NOW:**

1. **Run the migration fix** (5 minutes)
   - Open Supabase SQL Editor
   - Run `docs/fix-null-team-member-tasks.sql`
   - Apply the 2 pending migrations

2. **Then choose your priority:**
   - **Option A (Security First):** RLS Audit (safer, more work)
   - **Option B (Feature First):** Expiring Soon Module (user value, faster)
   - **Option C (Testing First):** Test Routine Tasks Phase 2 (validate what's built)

**My Recommendation:** 
**Security First (Option A)** → Can't risk data leaks between organizations!

---

**What would you like to tackle next? 🚀**
