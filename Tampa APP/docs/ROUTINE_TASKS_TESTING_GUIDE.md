# ✅ TASK #2: Test Routine Tasks Features - Complete Testing Guide

**Priority:** 🟠 HIGH - Critical Path  
**Status:** 🧪 Ready for Testing  
**Estimated Time:** 30-45 minutes  
**Created:** January 15, 2026

---

## 🎯 TESTING OBJECTIVES

After successful database migrations, we need to verify that all 5 new features work correctly:

1. ✅ **Calendar Integration** - Date picker navigation
2. ✅ **Mandatory Assigned Field** - Required validation
3. ✅ **Activity History** - Timeline tracking
4. ✅ **Recurring Tasks** - Pattern creation
5. ✅ **Custom Task Types** - "Others" specification

---

## 🚀 QUICK START

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open browser: `http://localhost:5173`

3. Navigate to: **Routine Tasks** page

4. Follow the test scenarios below

---

## 📋 TEST SCENARIO 1: Calendar Integration

**Feature:** Timeline view with calendar date picker

### Test Steps:

1. **Navigate to Timeline View:**
   - Go to Routine Tasks page
   - Click **"Timeline"** tab (if not already selected)
   - ✅ Verify: Calendar icon appears in navigation

2. **Test Calendar Picker:**
   - Click the **calendar icon** button
   - ✅ Verify: Popover opens with calendar
   - Select a date (e.g., 3 days from today)
   - ✅ Verify: Calendar closes
   - ✅ Verify: Date updates in display
   - ✅ Verify: Tasks for that date load

3. **Test Arrow Navigation:**
   - Click **left arrow (←)** button
   - ✅ Verify: Date moves to previous day
   - ✅ Verify: Tasks update
   - Click **right arrow (→)** button
   - ✅ Verify: Date moves to next day
   - ✅ Verify: Tasks update

4. **Test "Today" Button:**
   - Navigate to a different date (using calendar)
   - Click **"Today"** button
   - ✅ Verify: Returns to current date
   - ✅ Verify: "Today" button highlights (different style)

5. **Test Mobile Responsiveness:**
   - Open DevTools (F12)
   - Switch to mobile view (375px width)
   - ✅ Verify: Icons display correctly
   - ✅ Verify: Date shows below navigation
   - ✅ Verify: Calendar popover works

### Expected Results:
- ✅ Calendar opens on click
- ✅ Date selection works
- ✅ Navigation arrows functional
- ✅ "Today" button highlights when on current date
- ✅ Responsive on mobile

### ❌ Common Issues:
- **Calendar doesn't open:** Check console for errors
- **Date doesn't update:** Verify state management
- **Today button not highlighting:** Check date comparison logic

---

## 📋 TEST SCENARIO 2: Mandatory Assigned Field

**Feature:** Required team member assignment with validation

### Test Steps:

1. **Open Create Task Dialog:**
   - Click **"New Task"** button
   - ✅ Verify: Dialog opens
   - ✅ Verify: "Assign To" field has red asterisk (*)

2. **Test Empty Submission:**
   - Fill in **Title**: "Test Task"
   - Select **Task Type**: "Daily Cleaning"
   - Select **Priority**: "Normal"
   - Select **Scheduled Date**: Today
   - **Leave "Assign To" empty**
   - Try to click **"Create Task"** button
   - ✅ Verify: Button is **DISABLED**
   - ✅ Verify: Button text shows "Assign Someone First"
   - ✅ Verify: Warning icon (AlertCircle) appears

3. **Test Field Validation:**
   - Click on "Assign To" dropdown
   - ✅ Verify: Field has **yellow border** (indicating required)
   - ✅ Verify: Warning message below field
   - ✅ Verify: Team members list loads

4. **Test Successful Assignment:**
   - Select a team member from dropdown
   - ✅ Verify: Field border changes to normal
   - ✅ Verify: Warning message disappears
   - ✅ Verify: Submit button **ENABLES**
   - ✅ Verify: Button text changes to "Create Task"

5. **Test Avatar Display:**
   - Open "Assign To" dropdown again
   - ✅ Verify: Each team member has avatar with initials
   - ✅ Verify: Names display correctly

6. **Create the Task:**
   - Click **"Create Task"** button
   - ✅ Verify: Task creates successfully
   - ✅ Verify: Toast notification appears
   - ✅ Verify: Dialog closes
   - ✅ Verify: New task appears in list

### Expected Results:
- ✅ Cannot submit without assignment
- ✅ Visual indicators (red asterisk, yellow border)
- ✅ Button disabled state works
- ✅ Validation messages clear
- ✅ Task creates with assigned member

### ❌ Common Issues:
- **Button not disabled:** Check form watch logic
- **No team members in dropdown:** Verify team_members table has data
- **Validation not working:** Check Zod schema

---

## 📋 TEST SCENARIO 3: Activity History

**Feature:** Automatic timeline tracking of all task changes

### Test Steps:

1. **Create a New Task:**
   - Create task with title "Activity Test"
   - Assign to team member
   - ✅ Note the time created

2. **View Initial Activity:**
   - Click on the created task to open details
   - Scroll to **"Activity History"** section
   - ✅ Verify: Shows "created" activity
   - ✅ Verify: Shows who created it
   - ✅ Verify: Shows when (relative time, e.g., "2 minutes ago")
   - ✅ Verify: Shows creation emoji (🎉)

3. **Test Status Change:**
   - Change status from "Not Started" to **"In Progress"**
   - Save changes
   - ✅ Verify: New "status_changed" activity appears
   - ✅ Verify: Shows old → new status
   - ✅ Verify: Shows timestamp
   - ✅ Verify: Status emoji appears (🔄)

4. **Test Assignment Change:**
   - Reassign task to different team member
   - Save changes
   - ✅ Verify: "assignment_changed" activity appears
   - ✅ Verify: Shows previous → new assignee names
   - ✅ Verify: User icon appears (👤)

5. **Test Title Update:**
   - Change task title to "Activity Test Updated"
   - Save changes
   - ✅ Verify: "title_updated" activity appears
   - ✅ Verify: Shows edit emoji (✏️)

6. **Test Priority Change:**
   - Change priority from "Normal" to **"Critical"**
   - Save changes
   - ✅ Verify: "priority_changed" activity appears
   - ✅ Verify: Shows alert emoji (⚠️)

7. **Test Photo Upload:**
   - Upload a photo attachment
   - ✅ Verify: "attachment_added" activity appears
   - ✅ Verify: Shows camera emoji (📷)

8. **Test Timeline Scrolling:**
   - Make several more changes
   - ✅ Verify: Timeline scrolls smoothly
   - ✅ Verify: Shows most recent first (top)
   - ✅ Verify: Color coding works (different colors per type)

9. **Test Empty State:**
   - Create a brand new task
   - View activity immediately
   - ✅ Verify: Shows only "created" entry
   - ✅ Verify: No error messages

### Expected Results:
- ✅ All changes tracked automatically
- ✅ Timestamps display correctly
- ✅ Color-coded by activity type
- ✅ Emojis display properly
- ✅ Scrollable timeline
- ✅ Real-time updates

### ❌ Common Issues:
- **No activities showing:** Check triggers installed
- **Timestamp wrong:** Verify timezone settings
- **Missing activity types:** Check trigger function logic
- **Empty state:** Verify task_activity_log table exists

---

## 📋 TEST SCENARIO 4: Recurring Tasks

**Feature:** Create tasks that repeat automatically

### Test Steps:

1. **Open Create Task Dialog:**
   - Click "New Task"
   - Fill required fields:
     - Title: "Daily Temperature Check"
     - Type: "Temperature"
     - Priority: "Critical"
     - Assign to: [Select team member]
     - Date: Today

2. **Enable Recurrence:**
   - Scroll to **"Recurrence Settings"** section
   - ✅ Verify: Section visible with Repeat icon (🔄)
   - Click **"Recurring Task"** checkbox
   - ✅ Verify: Frequency options appear below

3. **Test Daily Recurrence:**
   - Select radio button: **"Daily"** (📅)
   - ✅ Verify: Radio button selects
   - ✅ Verify: Shows "Every day" description
   - Leave end date empty (repeats forever)
   - Create task
   - ✅ Verify: Task created successfully

4. **Verify Pattern Saved:**
   - Open browser DevTools → Network tab
   - Look at the POST request for task creation
   - ✅ Verify: `recurrence_pattern` field exists:
     ```json
     {
       "frequency": "daily",
       "interval": 1
     }
     ```

5. **Test Weekly Recurrence:**
   - Create another task: "Weekly Deep Clean"
   - Enable recurrence
   - Select: **"Weekly"** (📆)
   - ✅ Verify: Shows "Every 7 days"
   - Create task
   - ✅ Verify: Pattern: `{ frequency: "weekly", interval: 1 }`

6. **Test Biweekly Recurrence:**
   - Create task: "Biweekly Inventory"
   - Enable recurrence
   - Select: **"Biweekly"** (🗓️)
   - ✅ Verify: Shows "Every 14 days"
   - Create task
   - ✅ Verify: Pattern: `{ frequency: "weekly", interval: 2 }`

7. **Test Monthly Recurrence:**
   - Create task: "Monthly Maintenance"
   - Enable recurrence
   - Select: **"Monthly"** (📊)
   - ✅ Verify: Shows "Every 30 days"
   - Create task
   - ✅ Verify: Pattern: `{ frequency: "monthly", interval: 1 }`

8. **Test End Date:**
   - Create task with recurrence
   - Select frequency: "Daily"
   - Click **"End Date"** field
   - ✅ Verify: Calendar popover opens
   - Select date 30 days from now
   - ✅ Verify: Date displays in field
   - Create task
   - ✅ Verify: Pattern includes `end_date`: "YYYY-MM-DD"

9. **Test Toggle Off:**
   - Start creating a task
   - Enable recurrence → Select frequency
   - **Uncheck "Recurring Task"**
   - ✅ Verify: Frequency options disappear
   - ✅ Verify: End date field disappears
   - Create task
   - ✅ Verify: `recurrence_pattern` is null/undefined

10. **Test Switching Frequencies:**
    - Enable recurrence
    - Select "Daily" → Check selected
    - Select "Weekly" → Check switches
    - Select "Biweekly" → Check switches
    - Select "Monthly" → Check switches
    - ✅ Verify: Only one selected at a time

### Expected Results:
- ✅ Toggle shows/hides options
- ✅ All 4 frequencies work
- ✅ End date optional
- ✅ Pattern saves correctly
- ✅ Radio buttons mutually exclusive

### Expected Database Values:

| Frequency | Stored As |
|-----------|-----------|
| Daily | `{ frequency: "daily", interval: 1 }` |
| Weekly | `{ frequency: "weekly", interval: 1 }` |
| Biweekly | `{ frequency: "weekly", interval: 2 }` |
| Monthly | `{ frequency: "monthly", interval: 1 }` |

### ❌ Common Issues:
- **Options don't appear:** Check conditional rendering logic
- **Pattern not saving:** Check handleSubmit function
- **Wrong interval:** Verify biweekly logic (should be interval: 2)

---

## 📋 TEST SCENARIO 5: Custom Task Types

**Feature:** Specify custom task type when selecting "Others"

### Test Steps:

1. **Open Create Task Dialog:**
   - Click "New Task"
   - Fill title: "Inventory Count"

2. **Select "Others" Type:**
   - Click **"Task Type"** dropdown
   - Select: **"Others"**
   - ✅ Verify: New field appears below dropdown

3. **Test Field Appearance:**
   - ✅ Verify: Field labeled "Specify Task Type *" (with red asterisk)
   - ✅ Verify: Placeholder shows examples: "e.g., Inventory count, Staff meeting, Training..."
   - ✅ Verify: Field has **yellow border**
   - ✅ Verify: Warning icon (⚠️) with message below

4. **Test Empty Validation:**
   - Leave custom field **empty**
   - Try to submit
   - ✅ Verify: Form validation prevents submit
   - ✅ Verify: Error message appears

5. **Test Custom Type Entry:**
   - Type: "Inventory Count"
   - ✅ Verify: Border becomes normal
   - ✅ Verify: Warning disappears
   - Fill other required fields
   - Create task

6. **Verify Data Saved:**
   - Check database (Supabase dashboard)
   - Find the created task
   - ✅ Verify: `task_type` = "others"
   - ✅ Verify: `description` = "[Inventory Count] [original description]"
   - ✅ Verify: Custom type visible in brackets

7. **Test Different Task Type:**
   - Create another task
   - Select Task Type: **"Daily Cleaning"** (not Others)
   - ✅ Verify: Custom field **does NOT appear**
   - ✅ Verify: Can submit normally

8. **Test Switching Types:**
   - Start with "Others" selected → Custom field appears
   - Switch to "Temperature" → Custom field **disappears**
   - Switch back to "Others" → Custom field **reappears**
   - ✅ Verify: Field resets when switching

9. **Test Various Custom Types:**
   - Try: "Staff Meeting"
   - Try: "Equipment Inspection"
   - Try: "Supplier Visit"
   - Try: "Quality Audit"
   - ✅ Verify: All save correctly

10. **Test Long Custom Type:**
    - Enter 50+ character custom type
    - ✅ Verify: Accepts long text
    - ✅ Verify: Displays correctly in task detail

### Expected Results:
- ✅ Field appears only when "Others" selected
- ✅ Required validation works
- ✅ Custom type prepended to description
- ✅ Switching types shows/hides field
- ✅ Accepts various text inputs

### Expected Format in Database:
```
task_type: "others"
description: "[Inventory Count] Check all stock levels in storage"
```

### ❌ Common Issues:
- **Field doesn't appear:** Check `form.watch("task_type")` logic
- **Not required:** Check Zod `.refine()` validation
- **Not saving:** Verify handleSubmit description building

---

## 🎯 COMPREHENSIVE TEST CHECKLIST

### All Features Combined:

- [ ] **Test 1: Calendar Integration**
  - [ ] Calendar picker opens
  - [ ] Date selection works
  - [ ] Arrow navigation works
  - [ ] "Today" button works
  - [ ] Mobile responsive

- [ ] **Test 2: Mandatory Assignment**
  - [ ] Button disabled when empty
  - [ ] Visual indicators appear
  - [ ] Validation messages work
  - [ ] Enables when assigned
  - [ ] Task creates successfully

- [ ] **Test 3: Activity History**
  - [ ] Creation logged
  - [ ] Status changes logged
  - [ ] Assignment changes logged
  - [ ] Title updates logged
  - [ ] Priority changes logged
  - [ ] Attachments logged
  - [ ] Timeline scrolls
  - [ ] Colors/emojis correct

- [ ] **Test 4: Recurring Tasks**
  - [ ] Toggle shows/hides options
  - [ ] Daily pattern works
  - [ ] Weekly pattern works
  - [ ] Biweekly pattern works
  - [ ] Monthly pattern works
  - [ ] End date optional
  - [ ] Pattern saves correctly

- [ ] **Test 5: Custom Task Types**
  - [ ] Field appears for "Others"
  - [ ] Field hidden for other types
  - [ ] Required validation works
  - [ ] Custom type saves
  - [ ] Format correct in database

---

## 🧪 INTEGRATION TESTS

### Test Multiple Features Together:

**Scenario A: Create Recurring Task with Custom Type**
1. Create task with Type: "Others"
2. Custom type: "Weekly Team Meeting"
3. Enable recurrence: Weekly
4. Assign to team member
5. ✅ Verify: All features work together
6. ✅ Check database: Both fields saved

**Scenario B: Edit Task and Check Activity**
1. Create task with all fields
2. Edit multiple fields (status, assignment, priority)
3. Upload photo
4. ✅ Verify: All activities logged
5. ✅ Verify: Timeline shows all changes in order

**Scenario C: Mobile Experience**
1. Switch to mobile view (375px)
2. Navigate calendar
3. Create task with all features
4. View activity history
5. ✅ Verify: All responsive
6. ✅ Verify: Touch targets adequate

---

## 📊 VERIFICATION QUERIES

Run these in Supabase SQL Editor to verify data:

```sql
-- 1. Check tasks have team_member_id (no NULL)
SELECT COUNT(*) 
FROM routine_tasks 
WHERE team_member_id IS NULL;
-- Expected: 0

-- 2. Check recurrence patterns saved
SELECT 
  id, 
  title, 
  recurrence_pattern
FROM routine_tasks 
WHERE recurrence_pattern IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check activity tracking
SELECT 
  activity_type,
  COUNT(*) as count
FROM task_activity_log
GROUP BY activity_type
ORDER BY count DESC;

-- 4. Check custom task types
SELECT 
  id,
  title,
  task_type,
  description
FROM routine_tasks
WHERE task_type = 'others'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check recent activities
SELECT 
  t.title,
  a.activity_type,
  a.details,
  a.created_at
FROM task_activity_log a
JOIN routine_tasks t ON t.id = a.task_id
ORDER BY a.created_at DESC
LIMIT 10;
```

---

## ✅ SUCCESS CRITERIA

All tests pass if:

1. ✅ **Calendar**: Date navigation works smoothly
2. ✅ **Mandatory Field**: Cannot create unassigned tasks
3. ✅ **Activity History**: All changes tracked automatically
4. ✅ **Recurring Tasks**: Patterns save correctly for all frequencies
5. ✅ **Custom Types**: "Others" specification works and formats correctly
6. ✅ **No Console Errors**: Check browser DevTools
7. ✅ **Database Integrity**: All fields saving correctly
8. ✅ **Mobile Responsive**: Works on small screens
9. ✅ **Performance**: No lag or freezing

---

## 🐛 DEBUGGING TIPS

### If Tests Fail:

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for red errors
   - Note line numbers and messages

2. **Check Network Tab:**
   - See API requests/responses
   - Verify data being sent
   - Check for 400/500 errors

3. **Check Supabase Logs:**
   - Dashboard → Logs
   - Filter by time range
   - Look for database errors

4. **Verify Migrations:**
   ```sql
   -- Check constraint exists
   SELECT * FROM information_schema.table_constraints
   WHERE table_name = 'routine_tasks'
   AND constraint_name LIKE '%not_null%';
   
   -- Check triggers
   SELECT tgname FROM pg_trigger
   WHERE tgrelid = 'routine_tasks'::regclass;
   ```

5. **Check Component State:**
   - Use React DevTools
   - Inspect form values
   - Check watch values

---

## 📝 TEST RESULTS LOG

After testing, record results:

```
Date: January 15, 2026
Tester: [Your Name]

Calendar Integration:       [ PASS / FAIL ]
Mandatory Assignment:       [ PASS / FAIL ]
Activity History:           [ PASS / FAIL ]
Recurring Tasks:            [ PASS / FAIL ]
Custom Task Types:          [ PASS / FAIL ]

Issues Found:
1. [Issue description]
2. [Issue description]

Notes:
[Any observations or suggestions]
```

---

## 🎉 AFTER TESTING

Once all tests pass:

1. ✅ Update MODULES_TODO_LIST.md
2. ✅ Mark "Test routine tasks" as complete
3. ✅ Move to next priority: **Feed Module** or **Stripe Webhooks**
4. ✅ Document any bugs found
5. ✅ Celebrate! 🎊

---

**Testing Guide Complete!**  
**Estimated Time:** 30-45 minutes  
**Priority:** 🟠 HIGH  
**Status:** Ready to Execute

---

## 🚀 QUICK TEST (5 Minutes)

Short version if you're in a hurry:

1. ✅ Create task → Verify can't submit without assignment
2. ✅ Navigate calendar → Select different dates
3. ✅ Create task → Check activity history shows "created"
4. ✅ Enable recurrence → Select "Weekly" → Create task
5. ✅ Select "Others" type → Enter custom → Create task

If all 5 work, you're good to go! 🎉
