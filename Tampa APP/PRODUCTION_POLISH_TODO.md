# 🚀 Production Polish & Deployment Checklist

**Status:** In Progress  
**Target:** Deploy to new Vercel account with Resend email integration  
**Date Created:** January 30, 2026

---

## 📋 Pre-Deployment Polish Tasks

### 🔍 1. GENERAL: Fix Search Icon Conflicting with Placeholder
**Status:** ⏳ In Progress (1/11 fixed)
**Priority:** High  
**Affected Components:**
- All input fields with search functionality
- Common pattern: `<Search className="absolute left-3 top-1/2 -translate-y-1/2" />`

**Files to Check:**
- `src/components/**/*.tsx` (all input fields)
- `src/pages/**/*.tsx` (all search inputs)

**Solution:**
- Option A: Move icon to the right side
- Option B: Reduce icon size and adjust padding
- Option C: Make icon lighter/transparent when typing

**Steps:**
1. [x] Search for all instances of search icon in inputs: `grep -r "Search className" src/`
2. [x] Identify conflicting patterns
3. [x] Implement consistent solution (pl-10 → pl-11 + pointer-events-none)
4. [x] Created SearchInput component
5. [x] Fixed ExpiringSoon.tsx
6. [ ] Fix remaining 10 files
7. [ ] Test responsiveness on mobile/tablet/desktop
8. [ ] **NEW: Test iPad responsiveness specifically**

---

### 📱 1.1. EXPIRING SOON: Mobile & iPad Responsiveness
**Status:** ⏳ Pending  
**Priority:** High  
**Location:** `src/pages/ExpiringSoon.tsx`

**Issues to Fix:**
- [ ] Cards may stack poorly on mobile
- [ ] Search/filter bar needs mobile optimization
- [ ] Grid layout needs responsive breakpoints
- [ ] Touch targets need to be 44px minimum
- [ ] iPad landscape/portrait layout optimization

**Testing Devices:**
- iPhone (375px, 390px, 414px)
- iPad (768px, 810px, 1024px)
- Android tablets

**Steps:**
1. [ ] Test on iPad (768px-1024px)
2. [ ] Test on mobile (375px-414px)
3. [ ] Adjust grid breakpoints
4. [ ] Fix filter bar stacking
5. [ ] Verify touch targets
6. [ ] Test orientation changes

---

### ✅ 2. ROUTINE TASKS: Fix "Add Task" Functionality
**Status:** ⏳ Pending  
**Priority:** High  
**Location:** `src/pages/RoutineTasks.tsx`

**Issues to Fix:**
- [ ] Verify "Add Task" button is functional
- [ ] Check form validation
- [ ] Test task creation with all fields
- [ ] Verify task appears in list after creation
- [ ] Test edit/delete functionality

**Testing Checklist:**
- [ ] Create task with all required fields
- [ ] Create task with optional fields
- [ ] Edit existing task
- [ ] Delete task
- [ ] Check RLS policies for tasks

---

### 📅 3. PEOPLE: Add Year Selector to Date Picker
**Status:** ⏳ Pending  
**Priority:** Medium  
**Location:** `src/pages/People.tsx` (Birthday/Date fields)

**Current State:**
- Date picker may not have easy year selection
- Users need to scroll through months to reach distant years

**Solution:**
- Add year dropdown/selector to date picker
- Allow direct year input
- Consider age-appropriate year range (e.g., 1950-2010 for employees)

**Steps:**
1. [ ] Find date picker component: `grep -r "DatePicker\|Calendar" src/pages/People.tsx`
2. [ ] Check if using shadcn/ui Calendar component
3. [ ] Add year selector functionality
4. [ ] Test with edge cases (very old/young dates)

---

### 📎 4. FEED: Create Storage Bucket for Post Attachments
**Status:** ⏳ Pending  
**Priority:** High  
**Location:** `src/pages/Feed.tsx` + Supabase Storage

**Requirements:**
- Create Supabase Storage bucket for feed attachments
- Support images, videos, PDFs
- Implement file upload UI
- Add file size limits
- Generate thumbnails for images/videos

**Steps:**
1. [ ] Create Supabase Storage bucket: `feed-attachments`
2. [ ] Configure bucket policies (public read, authenticated write)
3. [ ] Add file upload component to Feed post creation
4. [ ] Implement image preview
5. [ ] Add file size validation (max 10MB images, 50MB videos)
6. [ ] Store attachment URLs in feed_posts table
7. [ ] Display attachments in feed cards
8. [ ] Add delete attachment functionality

**SQL Migration Needed:**
```sql
-- Add attachments column to feed_posts
ALTER TABLE feed_posts 
ADD COLUMN attachments JSONB DEFAULT '[]';

COMMENT ON COLUMN feed_posts.attachments IS 'Array of attachment objects with url, type, size';
```

---

### 📱 5. SETTINGS: Fix Top Tab Responsiveness
**Status:** ⏳ Pending  
**Priority:** Medium  
**Location:** `src/pages/Settings.tsx`

**Issues:**
- Top tabs may overflow on mobile
- Text may be too small or truncated
- Spacing issues on tablet

**Solution:**
- Implement responsive tab design
- Use ScrollArea for overflow
- Consider dropdown menu on mobile
- Ensure touch targets are 44px minimum

**Steps:**
1. [ ] Test Settings page on mobile (375px width)
2. [ ] Test on tablet (768px width)
3. [ ] Identify overflow/spacing issues
4. [ ] Implement ScrollArea or dropdown solution
5. [ ] Verify all tabs are accessible
6. [ ] Test swipe gestures on mobile

---

### ⏰ 6. EXPIRING SOON: Simplify to 3 Categories
**Status:** ⏳ Pending  
**Priority:** High  
**Location:** `src/pages/ExpiringSoon.tsx`

**Current Categories:** 4 (likely: Expired, Today, Tomorrow, This Week)  
**New Categories:** 3

1. **🔴 Expired (Critical)**
   - Items past expiry date
   - Red badge/urgent indicator
   - Show exact days overdue

2. **🟡 Expires Tomorrow (Warning)**
   - Items expiring in next 24 hours
   - Yellow badge/warning indicator
   - Requires immediate attention

3. **🟢 3-7 Days Left (Upcoming)**
   - Items expiring in 3-7 days
   - Green badge/info indicator
   - Plan ahead items

**Steps:**
1. [ ] Find current category logic: `grep -r "expir" src/pages/ExpiringSoon.tsx`
2. [ ] Update filtering logic to 3 categories
3. [ ] Update badge colors and icons
4. [ ] Update tab navigation to 3 tabs
5. [ ] Update database queries if needed
6. [ ] Test with various expiry dates
7. [ ] Update any related statistics/counts

**Code Changes:**
```typescript
// Old: 4 categories
const categories = ['expired', 'today', 'tomorrow', 'thisWeek'];

// New: 3 categories
const categories = ['expired', 'expiresTomorrow', 'upcoming'];
```

---

### 🧪 7. RECIPES: Remove Debug Info for Production
**Status:** ⏳ Pending  
**Priority:** High  
**Location:** `src/pages/Recipes.tsx` and related components

**Debug Info to Remove:**
- Console.log statements
- Debug panels/cards
- Test data displays
- Development-only UI elements
- Performance timing logs

**Steps:**
1. [ ] Search for console.log: `grep -r "console.log\|console.error\|console.warn" src/pages/Recipes.tsx`
2. [ ] Search for debug components: `grep -r "debug\|Debug\|DEBUG" src/pages/Recipes.tsx`
3. [ ] Remove or comment out debug code
4. [ ] Keep error logging for production (use proper error tracking)
5. [ ] Verify functionality still works
6. [ ] Test recipe creation/editing/deletion

**Find All Debug Code:**
```bash
# Search entire src directory
grep -r "console\." src/ --include="*.tsx" --include="*.ts"
grep -ri "debug" src/ --include="*.tsx" --include="*.ts"
```

---

## 🚀 Deployment Preparation

### 📧 Resend Email Integration
**Status:** ⏳ Pending  
**Priority:** High  
**Prerequisites:** Resend API credentials ready

**Steps:**
1. [ ] Install Resend package: `npm install resend`
2. [ ] Add Resend API key to Vercel environment variables
3. [ ] Create email templates for:
   - [ ] Welcome email
   - [ ] Password reset
   - [ ] Team invitation
   - [ ] Training assignment notification
   - [ ] Expiring item alerts
4. [ ] Create Supabase Edge Function for sending emails
5. [ ] Test email sending in development
6. [ ] Configure email triggers (Database triggers or webhooks)
7. [ ] Verify email deliverability

**Environment Variables Needed:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Edge Function Example:**
```typescript
// supabase/functions/send-email/index.ts
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const { to, subject, html } = await req.json();
  
  const data = await resend.emails.send({
    from: 'Tampa APP <noreply@yourdomain.com>',
    to,
    subject,
    html,
  });
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

### 🌐 Vercel Deployment Setup
**Status:** ⏳ Pending  
**Priority:** High  
**Prerequisites:** New Vercel account ready

**Steps:**

#### 1. Pre-Deployment Checks
- [ ] Run build locally: `npm run build`
- [ ] Fix all TypeScript errors
- [ ] Fix all ESLint warnings (critical ones)
- [ ] Test production build: `npm run preview`
- [ ] Verify all environment variables are documented

#### 2. Create New Vercel Project
- [ ] Log in to new Vercel account
- [ ] Import GitHub repository
- [ ] Configure project settings:
  - Framework Preset: Vite
  - Root Directory: ./
  - Build Command: `npm run build`
  - Output Directory: `dist`

#### 3. Environment Variables in Vercel
Add the following to Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App Config
VITE_APP_NAME=Tampa APP
VITE_APP_URL=https://your-app.vercel.app
```

#### 4. Domain Configuration
- [ ] Add custom domain (if available)
- [ ] Configure DNS records
- [ ] Enable HTTPS
- [ ] Set up redirects (www → non-www or vice versa)

#### 5. Supabase Configuration
- [ ] Update Supabase Auth redirect URLs:
  - Add Vercel production URL
  - Add Vercel preview URLs pattern: `https://*-your-team.vercel.app`
- [ ] Update CORS settings if needed
- [ ] Verify RLS policies are production-ready

#### 6. Post-Deployment Testing
- [ ] Test authentication flow
- [ ] Test all main features
- [ ] Test on mobile devices
- [ ] Test email sending
- [ ] Check browser console for errors
- [ ] Verify analytics/monitoring (if configured)

---

## 📝 Step-by-Step Polish Execution Order

### Phase 1: Critical Fixes (Do First)
1. ✅ Fix Routine Tasks "Add Task"
2. 🔍 Fix Search Icon Conflicts
3. ⏰ Simplify Expiring Soon to 3 Categories
4. 🧪 Remove Recipe Debug Info

### Phase 2: Feature Enhancements
5. 📅 Add Year Selector to People Date Picker
6. 📎 Create Feed Attachments Bucket
7. 📱 Fix Settings Tab Responsiveness

### Phase 3: Integration & Deployment
8. 📧 Set up Resend Email Integration
9. 🌐 Deploy to New Vercel Account
10. ✅ Production Testing & QA

---

## 🧪 Testing Checklist (Before Deployment)

### Functionality Tests
- [ ] User authentication (login/logout/register)
- [ ] Dashboard loads correctly
- [ ] All navigation links work
- [ ] Forms submit successfully
- [ ] Data displays correctly
- [ ] Search/filter functions work
- [ ] File uploads work
- [ ] QR Scanner works
- [ ] Label printing works
- [ ] Team management works

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Responsive Design
- [ ] Mobile (375px - iPhone SE)
- [ ] Mobile (390px - iPhone 12/13/14)
- [ ] Mobile (414px - iPhone Plus)
- [ ] Tablet (768px - iPad)
- [ ] Desktop (1024px)
- [ ] Desktop (1440px)
- [ ] Desktop (1920px)

### Performance
- [ ] Lighthouse score > 90 (Performance)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No console errors in production
- [ ] Images are optimized
- [ ] Bundle size is reasonable

### Security
- [ ] All API keys are in environment variables
- [ ] No sensitive data in client-side code
- [ ] RLS policies are enabled and tested
- [ ] HTTPS is enforced
- [ ] CSP headers are configured (if needed)

---

## 📋 Files to Check/Modify Summary

```bash
# Search Icon Conflicts
src/components/**/*.tsx
src/pages/**/*.tsx

# Routine Tasks
src/pages/RoutineTasks.tsx
src/components/routine-tasks/**/*.tsx

# People Date Picker
src/pages/People.tsx
src/components/people/**/*.tsx

# Feed Attachments
src/pages/Feed.tsx
src/components/feed/**/*.tsx
supabase/migrations/YYYYMMDD_add_feed_attachments.sql

# Settings Responsiveness
src/pages/Settings.tsx

# Expiring Soon
src/pages/ExpiringSoon.tsx
src/components/expiring-soon/**/*.tsx

# Recipes Debug
src/pages/Recipes.tsx
src/components/recipes/**/*.tsx

# Email Integration
supabase/functions/send-email/index.ts
src/lib/email.ts (create new)
```

---

## 🎯 Success Criteria

- [ ] All 7 polish items completed
- [ ] Zero console errors in production
- [ ] All tests passing
- [ ] Responsive on all devices
- [ ] Email integration working
- [ ] Successfully deployed to Vercel
- [ ] Domain configured (if applicable)
- [ ] Monitoring/analytics set up
- [ ] Documentation updated

---

## 📚 Resources

### Vercel
- [Vercel Documentation](https://vercel.com/docs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)

### Resend
- [Resend Documentation](https://resend.com/docs)
- [React Email Templates](https://react.email/)
- [Supabase + Resend Guide](https://supabase.com/docs/guides/functions/examples/send-emails)

### Supabase
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Storage Buckets](https://supabase.com/docs/guides/storage)
- [Auth Configuration](https://supabase.com/docs/guides/auth)

---

## 📝 Notes

- Keep a backup of current production before deploying
- Test email sending in staging first
- Monitor error logs for first 24-48 hours after deployment
- Have rollback plan ready
- Document any issues found during deployment

---

**Last Updated:** January 30, 2026  
**Next Review:** After each phase completion
