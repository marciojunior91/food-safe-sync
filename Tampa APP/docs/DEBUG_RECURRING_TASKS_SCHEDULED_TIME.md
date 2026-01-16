# Debug Guide: Recurring Tasks Scheduled Time Issue

**Date**: 2026-01-16  
**Issue**: Recurring tasks appearing at 00:00 instead of correct scheduled_time (19:53)  
**Status**: 🔍 Debugging  

---

## Debug Logs Added

We've added comprehensive logging throughout the task rendering pipeline to identify where `scheduled_time` is being lost or ignored.

### Log Points

1. **Expansion** (`recurringTasks.ts`)
   - 🔍 Original task with scheduled_time
   - ✅ First instance created

2. **Filtering** (`TaskTimeline.tsx - dayTasks`)
   - 📅 Date filtering
   - 📋 Expanded tasks count
   - ✅ Matched tasks with scheduled_time

3. **Grouping** (`TaskTimeline.tsx - tasksByHour`)
   - 📊 Tasks being grouped
   - 🔢 Each task's scheduled_time and hour
   - 📦 Hour groups created

4. **Positioning** (`TaskTimeline.tsx - render`)
   - 🎯 Each task's positioning calculation
   - Shows: scheduled_time → hours/minutes → topPosition

---

## How to Debug

### Step 1: Open Browser Console
1. Press **F12** (or Right-click → Inspect)
2. Go to **Console** tab
3. Clear console (trash icon)

### Step 2: Trigger Task Display
1. Navigate to a day with the recurring task
2. Watch console output

### Step 3: Analyze Output

Look for this sequence:

```
🔍 Expanding recurring task: {
  id: "...",
  title: "Your Task",
  scheduled_date: "2026-01-17",
  scheduled_time: "19:53",  ← Should be 19:53, NOT null/undefined!
  recurrence_pattern: {...}
}

✅ First instance created: {
  id: "...",
  scheduled_date: "2026-01-17",
  scheduled_time: "19:53"  ← Should still be 19:53!
}

📅 Filtering tasks for date: 2026-01-17
📋 Total expanded tasks: X

✅ Task matches date: {
  title: "Your Task",
  scheduled_date: "2026-01-17",
  scheduled_time: "19:53"  ← Should still be 19:53!
}

📊 Grouping tasks by hour: X tasks

🔢 Task grouping: {
  title: "Your Task",
  scheduled_time: "19:53",  ← Should be 19:53!
  time_used: "19:53",       ← Should be 19:53!
  hour: 19                  ← Should be 19!
}

📦 Groups created: [19]  ← Should include 19!

🎯 Positioning task: {
  title: "Your Task",
  scheduled_time: "19:53",
  time_used: "19:53",
  hours: 19,
  minutes: 53,
  totalMinutes: 1193,
  topPosition: "82.847%",  ← Should be ~83% (near bottom of timeline)
  scheduled_date: "2026-01-17"
}
```

---

## Diagnostic Scenarios

### ✅ Scenario A: scheduled_time is null/undefined in original task
**Symptoms:**
```
🔍 Expanding recurring task: {
  scheduled_time: null  ← PROBLEM HERE!
}
```

**Cause:** Task was created without setting the time field.

**Solution:**
1. Edit the recurring task
2. Set scheduled_time to "19:53"
3. Save
4. All instances will update

**How to Fix:**
- Open task edit dialog
- Find "Scheduled Time" input
- Enter "19:53"
- Click Save

---

### ⚠️ Scenario B: scheduled_time lost during expansion
**Symptoms:**
```
🔍 Expanding recurring task: {
  scheduled_time: "19:53"  ← Present in original
}

✅ First instance created: {
  scheduled_time: null  ← LOST during expansion!
}
```

**Cause:** Expansion logic not copying scheduled_time correctly.

**Solution:** Already fixed in code with explicit copy:
```typescript
const instance: RoutineTask = {
  ...task,
  scheduled_date: format(currentDate, "yyyy-MM-dd"),
  scheduled_time: task.scheduled_time,  // Explicit copy
};
```

---

### ⚠️ Scenario C: Database has wrong format
**Symptoms:**
```
scheduled_time: "19:53:00"  ← Has seconds
// or
scheduled_time: "7:53 PM"   ← 12-hour format
```

**Cause:** Database stores time in different format than expected.

**Solution:** Check database column type:
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'routine_tasks' 
  AND column_name = 'scheduled_time';
```

Expected: `time` or `varchar` storing "HH:MM" format.

---

### ⚠️ Scenario D: Input field not saving correctly
**Symptoms:**
```
// User enters "19:53" in form
// But database has null or "00:00"
```

**Cause:** Form submission not including scheduled_time.

**Solution:** Check TaskForm payload:
1. Add log in TaskForm.tsx `onSubmit`:
```typescript
console.log('📤 Submitting task:', data);
```

2. Verify payload includes:
```json
{
  "scheduled_time": "19:53"
}
```

3. If missing, check form validation schema.

---

## Expected Timeline Position

For **19:53** (7:53 PM):
- **Total minutes**: 19 × 60 + 53 = 1193 minutes
- **Top position**: (1193 / 1440) × 100 = **82.847%**
- **Visual position**: Near bottom of timeline, between 19:00 and 20:00 markers

For **00:00** (midnight):
- **Total minutes**: 0
- **Top position**: 0%
- **Visual position**: Very top of timeline

---

## Quick Test: Check Database Directly

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  title,
  scheduled_date,
  scheduled_time,
  recurrence_pattern
FROM routine_tasks
WHERE title ILIKE '%your task name%'
LIMIT 5;
```

**Check:**
- Is `scheduled_time` populated?
- What format is it? (should be "HH:MM")
- Is it "19:53" or something else?

---

## Next Steps Based on Results

### If scheduled_time is NULL in database:
→ **Task wasn't saved with time**
- Edit task and set time
- Check form submission logs

### If scheduled_time is "19:53" in database but "00:00" in logs:
→ **Frontend query issue**
- Check Supabase query
- Verify column is selected
- Check TypeScript types

### If scheduled_time is "19:53" everywhere but still renders at top:
→ **CSS/positioning issue**
- Check TimelineGrid height
- Check topPosition calculation
- Inspect element in DevTools

---

## Report Format

Please copy this and fill in the values:

```
🔍 Original Task:
- scheduled_time: _______
- recurrence_pattern: _______

✅ First Instance:
- scheduled_time: _______

🔢 Grouping:
- time_used: _______
- hour: _______

🎯 Positioning:
- scheduled_time: _______
- hours: _______
- minutes: _______
- totalMinutes: _______
- topPosition: _______

📊 Database Value (from SQL query):
- scheduled_time: _______
```

---

## Files with Debug Logs

- ✅ `src/utils/recurringTasks.ts` - Expansion logging
- ✅ `src/components/routine-tasks/TaskTimeline.tsx` - Filtering, grouping, positioning logs

**To remove logs later:** Search for `console.log` in these files and delete the debug statements.

---

**Status**: Waiting for console output  
**Next Action**: User provides log results from browser console
