# People Module - Testing Guide 🧪

**Date:** January 2025  
**Module:** People Module - Team Management  
**Status:** Ready for User Testing

---

## Pre-Testing Checklist ✅

Before starting testing, verify:

- [x] Dev server is running (`npm run dev`)
- [x] All components compile without errors
- [x] You're logged in with a valid account
- [x] Your organization has users in the database

---

## How to Access the Module

1. Open your browser and go to: `http://localhost:5173` (or your dev server URL)
2. Log in if not already logged in
3. Navigate to **People** module:
   - Click "People" in the sidebar navigation, OR
   - Go directly to: `http://localhost:5173/people`

---

## Testing Checklist

### 1. Initial Load 🚀

**Expected Behavior:**
- Page loads without errors
- Header displays "People" with description
- Statistics cards appear at the top
- User cards display in a grid layout

**Check:**
- [ ] Page loads successfully
- [ ] No console errors
- [ ] Header and description visible
- [ ] Statistics cards visible
- [ ] User cards visible

**What to Look For:**
- Loading skeletons should appear briefly while data loads
- If no users exist, an empty state should display

---

### 2. Statistics Dashboard 📊

**Expected Statistics:**

**Card 1: Total Team**
- Shows total number of team members
- Displays active users count
- Shows on leave users count (if any)
- Badge for terminated users (if any)

**Card 2: By Role**
- Shows breakdown by role
- Displays count for each role with emoji:
  - 🔴 Admin
  - 🟣 Owner
  - 🟠 Leader Chef
  - 🔵 Cook
  - 🟢 Barista
- Expandable to see all roles

**Card 3: Compliance Rate**
- Shows percentage of users with valid documents
- Color-coded progress bar:
  - 🟢 Green: >80% compliant
  - 🟡 Amber: 60-80% compliant
  - 🔴 Red: <60% compliant
- Shows "X compliant of Y total"

**Card 4: Expiring Documents**
- Shows count of documents expiring in next 30 days
- Color-coded badge:
  - 🟡 Amber: If any expiring docs
  - 🟢 Green: If none expiring
- Shows breakdown by document type

**Check:**
- [ ] All 4 stat cards display
- [ ] Numbers make sense
- [ ] Progress bars display correctly
- [ ] Colors match expected states

---

### 3. User Cards 👤

**Expected Information on Each Card:**

**Top Section:**
- Avatar with initials (colored background)
- User name
- Role badge with color:
  - 🔴 Admin (red)
  - 🟣 Owner (purple)
  - 🟠 Leader Chef (orange)
  - 🔵 Cook (blue)
  - 🟢 Barista (green)

**Status Section:**
- Employment status:
  - ✅ Active (green badge)
  - 🏖️ On Leave (amber badge)
  - ❌ Terminated (red badge)
- Compliance status:
  - ✅ Compliant (green badge)
  - 🟡 Expiring Soon (amber badge)
  - 🔴 Expired (red badge)

**Contact Section:**
- Email address (if available)
- Phone number (if available)

**Bottom Section:**
- Document count
- "View Profile" button
- "Edit" button (dropdown menu)

**Check:**
- [ ] All user cards display
- [ ] Avatars show initials
- [ ] Role badges show correct colors
- [ ] Employment status displays
- [ ] Compliance status displays
- [ ] Contact info shows (if available)
- [ ] Action buttons work

**Test Actions:**
- [ ] Click "View Profile" → Should show toast "Coming soon!"
- [ ] Click action menu (•••) → Menu opens
- [ ] Click "Edit" → Should show toast "Coming soon!"

---

### 4. Filters & Search 🔍

**Filter Bar Components:**
- Search input (magnifying glass icon)
- Role dropdown
- Employment Status dropdown
- Advanced Filters button (with filter count badge)
- Clear Filters button (when filters active)

#### Test Search
1. Type in search box: "john" or any user name
2. **Expected:** Users matching name appear
3. Type an email: "test@example.com"
4. **Expected:** Users matching email appear
5. Clear search
6. **Expected:** All users return

**Check:**
- [ ] Search by name works
- [ ] Search by email works
- [ ] Search is case-insensitive
- [ ] Clear search works

#### Test Role Filter
1. Click "Role" dropdown
2. Select "Cook"
3. **Expected:** Only cooks display
4. Try other roles (Admin, Barista, etc.)
5. Select "All Roles"
6. **Expected:** All users return

**Check:**
- [ ] Role filter works for each role
- [ ] Filter badge shows "1 active"
- [ ] "All Roles" shows everyone

#### Test Employment Status Filter
1. Click "Employment Status" dropdown
2. Select "Active"
3. **Expected:** Only active users display
4. Select "On Leave"
5. **Expected:** Only users on leave display
6. Select "Terminated"
7. **Expected:** Only terminated users display
8. Select "All Statuses"
9. **Expected:** All users return

**Check:**
- [ ] Status filter works
- [ ] Filter badge updates
- [ ] "All Statuses" shows everyone

#### Test Advanced Filters
1. Click "Advanced Filters" button
2. **Expected:** Panel expands below
3. Try changing "Sort by":
   - Name A-Z
   - Role
   - Admission Date
   - Compliance Status
4. **Expected:** Users reorder accordingly
5. Toggle "Active Only" switch
6. **Expected:** Only active users show

**Check:**
- [ ] Advanced panel opens/closes
- [ ] Sort options work
- [ ] Active only toggle works
- [ ] Filter count badge updates

#### Test Combined Filters
1. Apply multiple filters:
   - Search: "john"
   - Role: "Cook"
   - Status: "Active"
2. **Expected:** Only active cooks named john
3. **Check:** Active filters display as removable badges
4. Click X on one badge
5. **Expected:** That filter removes
6. Click "Clear all filters"
7. **Expected:** All filters reset

**Check:**
- [ ] Multiple filters work together
- [ ] Active filters show as badges
- [ ] Remove individual filter works
- [ ] Clear all filters works

---

### 5. View Options 👁️

**Grid/List Toggle:**
1. Find toggle buttons (top right of list)
2. Click "List View" icon
3. **Expected:** Cards stack vertically (full width)
4. Click "Grid View" icon
5. **Expected:** Cards return to grid layout

**Check:**
- [ ] Grid view displays (default)
- [ ] List view displays
- [ ] Toggle switches views
- [ ] Preference persists

---

### 6. Responsive Design 📱

**Test Different Screen Sizes:**

#### Desktop (>1024px)
- **Expected:** 4 columns grid
- **Expected:** Full sidebar visible
- **Expected:** All content fits well

#### Tablet (768px - 1024px)
- **Expected:** 3 columns grid
- **Expected:** Sidebar collapses or adapts
- **Expected:** Stats in 2x2 grid

#### Mobile (<768px)
- **Expected:** 1 column grid
- **Expected:** Hamburger menu for sidebar
- **Expected:** Stats stack vertically
- **Expected:** Filters stack vertically

**Check:**
- [ ] Desktop layout works
- [ ] Tablet layout adapts
- [ ] Mobile layout works
- [ ] No horizontal scroll
- [ ] Buttons are tappable on mobile

**How to Test:**
- Use browser DevTools (F12)
- Click device toolbar icon
- Try different device presets
- Or resize browser window

---

### 7. Loading States ⏳

**Test Loading:**
1. Refresh the page
2. **Expected:** Loading skeletons appear
3. **Expected:** 8 skeleton cards in grid
4. **Expected:** Data loads and replaces skeletons

**Check:**
- [ ] Loading skeletons display
- [ ] Skeletons match card layout
- [ ] Smooth transition to real data

---

### 8. Empty States 🚫

**Test Empty State:**
1. Apply filters that match no users
   - Example: Search for "zzzzz"
2. **Expected:** Empty state displays:
   - Icon
   - "No team members found"
   - Message about filters
3. Clear filters
4. **Expected:** Users return

**Check:**
- [ ] Empty state displays when no results
- [ ] Message is helpful
- [ ] Clear filters suggestion works

---

### 9. Error Handling ❌

**Test Error State:**
This is harder to test without breaking things, but check:

1. If database connection fails
2. **Expected:** Error card displays
3. **Expected:** Error message is readable
4. **Expected:** "Try Again" button appears

**Check:**
- [ ] Error state displays (if error occurs)
- [ ] Error message is clear
- [ ] Retry button works

---

### 10. Actions & Interactions 🎯

#### Refresh Button
1. Click refresh button (↻ icon in header)
2. **Expected:** Loading spinner appears on button
3. **Expected:** Data refreshes
4. **Expected:** Toast: "Refreshed - Team list has been refreshed"

**Check:**
- [ ] Refresh button works
- [ ] Loading spinner shows
- [ ] Toast notification appears

#### Add User Button (Admin/Owner Only)
1. If you're an admin or owner, button should appear
2. Click "Add User" button
3. **Expected:** Toast: "Coming soon! - Add user functionality will be added"

**Check:**
- [ ] Button visible for admin/owner
- [ ] Button hidden for regular users
- [ ] Toast shows when clicked

#### View Profile
1. Click "View Profile" on any user card
2. **Expected:** Toast: "Coming soon! - Profile view for [Name] will be implemented"

**Check:**
- [ ] Button works
- [ ] Toast shows user name
- [ ] No errors in console

#### Edit User
1. Click action menu (•••) on any card
2. Click "Edit"
3. **Expected:** Toast: "Coming soon! - Edit functionality for [Name] will be implemented"

**Check:**
- [ ] Action menu opens
- [ ] Edit option visible
- [ ] Toast shows user name
- [ ] No errors in console

---

### 11. Performance ⚡

**Check Performance:**
- [ ] Page loads quickly (<2 seconds)
- [ ] Filters respond instantly
- [ ] Search is responsive (not laggy)
- [ ] No layout shifts during load
- [ ] Smooth animations (progress bars, etc.)

---

### 12. Browser Console 🐛

**Throughout testing, monitor the browser console:**

1. Open DevTools (F12)
2. Go to Console tab
3. **Expected:** No errors (red messages)
4. **Expected:** No warnings (yellow messages)

**Common issues to watch for:**
- Module not found errors
- Type errors
- Network errors
- Supabase connection issues

**Check:**
- [ ] No console errors
- [ ] No console warnings
- [ ] No network errors

---

## Known Limitations 📝

These are **expected** and **not bugs**:

1. **View Profile button shows toast** - Full profile component not yet built
2. **Edit button shows toast** - Edit dialog not yet built
3. **Add User button shows toast** - Create user dialog not yet built
4. **No avatar images** - profiles table lacks avatar_url column (initials shown instead)
5. **Department IDs instead of names** - No join to departments table yet

---

## What to Report 🐞

If you find issues, please note:

1. **What you did** (steps to reproduce)
2. **What you expected** (expected behavior)
3. **What happened** (actual behavior)
4. **Browser console errors** (if any)
5. **Screenshots** (if helpful)

**Example Bug Report:**
```
Steps:
1. Navigated to /people
2. Clicked "Role" filter
3. Selected "Cook"

Expected: Only cooks display
Actual: Page crashed with error

Console Error: [paste error here]
```

---

## Success Criteria ✅

The People module is working correctly if:

- ✅ Page loads without errors
- ✅ User cards display with correct information
- ✅ All 4 statistics cards show
- ✅ Filters work (search, role, status)
- ✅ Grid/list view toggle works
- ✅ Responsive on mobile/tablet/desktop
- ✅ Loading states display properly
- ✅ Empty states display when no results
- ✅ Action buttons show appropriate toasts
- ✅ No console errors during normal use

---

## After Testing 🎉

Once you've completed testing:

1. **If everything works:** 
   - Mark the test todo as complete
   - Celebrate! 🎉
   - Consider Phase 3 complete
   - Move to next iteration or enhancements

2. **If issues found:**
   - Report bugs with details
   - I'll fix any issues found
   - Re-test after fixes

---

## Quick Test (5 minutes)

If you want a quick smoke test:

1. ✅ Navigate to /people
2. ✅ Verify page loads and shows users
3. ✅ Check all 4 stat cards display
4. ✅ Try search (type a name)
5. ✅ Try role filter (select "Cook")
6. ✅ Click "View Profile" on a user
7. ✅ Test grid/list toggle
8. ✅ Check on mobile (resize browser)
9. ✅ Check console for errors

**If all 9 quick tests pass, the module is working! ✅**

---

## Need Help?

If something doesn't work as expected or you have questions about the testing process, just let me know what you're seeing and I'll help troubleshoot!

---

**Happy Testing! 🚀**
