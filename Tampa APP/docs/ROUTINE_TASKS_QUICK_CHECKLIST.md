# ✅ ROUTINE TASKS - Quick Testing Checklist

**Date:** January 15, 2026  
**Tester:** _____________  
**Time Started:** _______  
**Time Completed:** _______

---

## 🚀 QUICK START (5 Minutes)

### Before Testing:
- [ ] Development server running: `npm run dev`
- [ ] Browser open: http://localhost:5173
- [ ] Logged in successfully
- [ ] Navigated to: **Routine Tasks** page

---

## 📋 TEST 1: Mandatory Assignment Field

**Time:** 2 minutes

- [ ] Click "New Task" button
- [ ] Fill Title: "Test Task"
- [ ] Select Task Type: "Daily Cleaning"
- [ ] Select Priority: "Normal"
- [ ] **LEAVE "Assign To" EMPTY**
- [ ] ✓ Button shows "Assign Someone First"
- [ ] ✓ Button is DISABLED (grayed out)
- [ ] ✓ Field has yellow/orange border
- [ ] ✓ Warning icon appears
- [ ] Select a team member
- [ ] ✓ Button ENABLES
- [ ] ✓ Button text changes to "Create Task"
- [ ] ✓ Border returns to normal
- [ ] Click "Create Task"
- [ ] ✓ Task created successfully

**Result:** [ PASS / FAIL ]  
**Notes:** _______________________________________________

---

## 📋 TEST 2: Calendar Navigation

**Time:** 2 minutes

- [ ] Go to Timeline view (if not already there)
- [ ] Click **calendar icon** button
- [ ] ✓ Calendar popover opens
- [ ] Select a date **3 days from today**
- [ ] ✓ Calendar closes
- [ ] ✓ Date updates in header
- [ ] ✓ Tasks for that date load
- [ ] Click **left arrow (←)**
- [ ] ✓ Goes to previous day
- [ ] Click **right arrow (→)** twice
- [ ] ✓ Advances two days forward
- [ ] Click **"Today"** button
- [ ] ✓ Returns to current date
- [ ] ✓ "Today" button highlighted

**Result:** [ PASS / FAIL ]  
**Notes:** _______________________________________________

---

## 📋 TEST 3: Activity History

**Time:** 3 minutes

### Create Task:
- [ ] Create new task: "Activity Test"
- [ ] Fill all required fields + assign
- [ ] Click "Create Task"
- [ ] ✓ Task appears in list

### View Activity:
- [ ] Click on the task to open details
- [ ] Scroll to "Activity History" section
- [ ] ✓ Shows "created" activity
- [ ] ✓ Shows your name
- [ ] ✓ Shows timestamp (e.g., "just now")
- [ ] ✓ Shows creation emoji (🎉)

### Make Changes:
- [ ] Change status from "Not Started" to "In Progress"
- [ ] Save changes
- [ ] ✓ New "status_changed" activity appears
- [ ] ✓ Shows old → new status
- [ ] ✓ Status emoji appears (🔄)

### Optional (if time):
- [ ] Change assignment to different person
- [ ] ✓ "assignment_changed" activity logged
- [ ] Upload a photo
- [ ] ✓ "attachment_added" activity logged

**Result:** [ PASS / FAIL ]  
**Notes:** _______________________________________________

---

## 📋 TEST 4: Recurring Tasks

**Time:** 3 minutes

### Enable Recurrence:
- [ ] Click "New Task"
- [ ] Fill required fields:
  - Title: "Weekly Temperature Check"
  - Type: "Temperature"
  - Priority: "Critical"
  - Assign to: [Select member]
- [ ] Scroll to "Recurrence Settings"
- [ ] ✓ Section visible with Repeat icon
- [ ] Click "Recurring Task" checkbox
- [ ] ✓ Frequency options appear

### Test Frequencies:
- [ ] Click **"Daily"** radio button
- [ ] ✓ Selected (filled circle)
- [ ] ✓ Shows "Every day"
- [ ] Click **"Weekly"** radio button
- [ ] ✓ Switches to Weekly
- [ ] ✓ Shows "Every 7 days"
- [ ] Click **"Biweekly"**
- [ ] ✓ Switches to Biweekly
- [ ] ✓ Shows "Every 14 days"
- [ ] Click **"Monthly"**
- [ ] ✓ Switches to Monthly
- [ ] ✓ Shows "Every 30 days"

### Create Recurring Task:
- [ ] Keep "Weekly" selected
- [ ] Click "Create Task"
- [ ] ✓ Task created successfully
- [ ] ✓ Shows in list

### Verify in Database (Optional):
- [ ] Open Supabase Dashboard
- [ ] Go to Table Editor → routine_tasks
- [ ] Find your task
- [ ] ✓ `recurrence_pattern` field has: `{ frequency: "weekly", interval: 1 }`

**Result:** [ PASS / FAIL ]  
**Notes:** _______________________________________________

---

## 📋 TEST 5: Custom Task Type

**Time:** 2 minutes

### Test Field Appearance:
- [ ] Click "New Task"
- [ ] Click "Task Type" dropdown
- [ ] Select **"Others"**
- [ ] ✓ New field appears below dropdown
- [ ] ✓ Field labeled "Specify Task Type *"
- [ ] ✓ Red asterisk visible
- [ ] ✓ Placeholder text shows examples
- [ ] ✓ Yellow border on field
- [ ] ✓ Warning message below

### Test Validation:
- [ ] Try to submit with empty custom field
- [ ] ✓ Form prevents submission
- [ ] ✓ Validation error appears

### Create Custom Task:
- [ ] Type custom type: "Inventory Count"
- [ ] ✓ Border becomes normal
- [ ] ✓ Warning disappears
- [ ] Fill other required fields
- [ ] Create task
- [ ] ✓ Task created successfully

### Test Type Switching:
- [ ] Start creating another task
- [ ] Select "Others" → Custom field appears
- [ ] Switch to "Daily Cleaning"
- [ ] ✓ Custom field DISAPPEARS
- [ ] Switch back to "Others"
- [ ] ✓ Custom field REAPPEARS
- [ ] ✓ Field is reset/empty

**Result:** [ PASS / FAIL ]  
**Notes:** _______________________________________________

---

## 🎯 OVERALL RESULTS

| Test | Status | Notes |
|------|--------|-------|
| 1. Mandatory Assignment | [ PASS / FAIL ] | |
| 2. Calendar Navigation | [ PASS / FAIL ] | |
| 3. Activity History | [ PASS / FAIL ] | |
| 4. Recurring Tasks | [ PASS / FAIL ] | |
| 5. Custom Task Types | [ PASS / FAIL ] | |

**Total Passed:** ____ / 5  
**Total Failed:** ____ / 5

---

## 🐛 BUGS FOUND

1. ________________________________________________
   Severity: [ Critical / High / Medium / Low ]
   Steps to reproduce: ________________________________

2. ________________________________________________
   Severity: [ Critical / High / Medium / Low ]
   Steps to reproduce: ________________________________

3. ________________________________________________
   Severity: [ Critical / High / Medium / Low ]
   Steps to reproduce: ________________________________

---

## 💡 OBSERVATIONS & SUGGESTIONS

_______________________________________________________
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## ✅ COMPLETION

- [ ] All tests completed
- [ ] All bugs documented
- [ ] Screenshots taken (if issues found)
- [ ] Console errors checked (F12)
- [ ] Ready to report results

---

## 🚀 NEXT STEPS

If all tests pass:
- ✅ Mark Routine Tasks as **COMPLETE** (100%)
- 🚀 Begin Feed Module development
- 📊 Update MODULES_TODO_LIST.md

If issues found:
- 🐛 Report bugs to developer
- 🔧 Fix critical issues first
- 🔁 Re-test after fixes

---

**Testing completed:** [ YES / NO ]  
**Ready for next phase:** [ YES / NO ]  
**Signature:** ________________  
**Date:** January 15, 2026
