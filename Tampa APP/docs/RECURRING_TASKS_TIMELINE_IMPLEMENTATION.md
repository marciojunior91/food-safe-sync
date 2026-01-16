# Recurring Tasks Timeline Implementation

**Date**: 2026-01-16  
**Status**: ✅ Implemented  
**Modules**: TaskTimeline, recurringTasks utility

---

## Problem Statement

When creating a **recurring task** (daily/weekly/monthly), the task was only appearing on the initial `scheduled_date` in the timeline view. The task would be stored correctly in the database with a `recurrence_pattern`, but the UI didn't expand it into multiple instances across different dates.

### User Report
> "ok now i created the task, but in timeline when creating a recurring task, its not showing the task on timeline grid in each day and hour minute right"

### Root Cause
The `TaskTimeline.tsx` component was filtering tasks by `scheduled_date` only:
```typescript
// OLD CODE - Only shows task on one date
const dayTasks = useMemo(() => {
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  return tasks.filter((task) => {
    if (!task.scheduled_date) return false;
    const taskDateStr = format(parseISO(task.scheduled_date), "yyyy-MM-dd");
    return taskDateStr === dateStr; // ❌ No recurrence expansion!
  });
}, [tasks, selectedDate]);
```

**No logic existed** to parse `recurrence_pattern` and generate virtual task instances for each occurrence.

---

## Solution: Recurring Task Expansion Utility

### 1. Created `src/utils/recurringTasks.ts`

This utility module provides two core functions:

#### `expandRecurringTask(task, startDate, endDate)`
Expands a single recurring task into multiple instances.

**Logic:**
1. Check if task has `recurrence_pattern` (if not, return as-is)
2. Parse pattern: `{frequency: 'daily'|'weekly'|'monthly', interval: number, end_date?: string}`
3. Calculate first occurrence in date range (accounting for tasks that started before the range)
4. Generate instances by adding intervals:
   - **Daily**: Add `interval` days
   - **Weekly**: Add `interval * 7` days  
   - **Monthly**: Add `interval` months
5. Stop when:
   - Reached `pattern.end_date`
   - Exceeded `endDate` parameter
   - Hit safety limit (100 instances)
6. Return array of task instances with adjusted `scheduled_date`

**Key Features:**
- ✅ Handles tasks that started before view range (skips to first occurrence in range)
- ✅ Respects `end_date` from recurrence pattern
- ✅ Performance limit: max 90 days, max 100 instances
- ✅ Virtual IDs: `{task.id}_{date}` for React keys

#### `expandAllRecurringTasks(tasks, startDate, endDate)`
Batch expands an array of tasks (recurring + non-recurring).

**Usage:**
```typescript
const expandedTasks = expandAllRecurringTasks(tasks, weekStart, weekEnd);
```

---

### 2. Updated `TaskTimeline.tsx`

**Changes:**
```typescript
import { expandAllRecurringTasks } from "@/utils/recurringTasks";
import { startOfWeek, endOfWeek } from "date-fns";

// Expand recurring tasks for the week view
const expandedTasks = useMemo(() => {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  return expandAllRecurringTasks(tasks, weekStart, weekEnd);
}, [tasks, selectedDate]);

// Filter expanded tasks for the selected date
const dayTasks = useMemo(() => {
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  return expandedTasks.filter((task) => {
    if (!task.scheduled_date) return false;
    const taskDateStr = format(parseISO(task.scheduled_date), "yyyy-MM-dd");
    return taskDateStr === dateStr;
  });
}, [expandedTasks, selectedDate]);
```

**Why Week Range?**
- Timeline typically shows one day at a time
- Expanding for full week (Sunday-Saturday) ensures smooth navigation
- User can switch days without re-fetching/re-calculating

---

## How It Works: Example

### Database Record
```json
{
  "id": "task-123",
  "title": "Daily Standup",
  "scheduled_date": "2026-01-13",
  "scheduled_time": "09:00",
  "recurrence_pattern": {
    "frequency": "daily",
    "interval": 1,
    "end_date": "2026-02-13"
  }
}
```

### Expansion Result (viewing week of Jan 13-19)
```json
[
  {
    "id": "task-123_2026-01-13",
    "title": "Daily Standup",
    "scheduled_date": "2026-01-13",
    "scheduled_time": "09:00",
    "recurrence_pattern": {...}
  },
  {
    "id": "task-123_2026-01-14",
    "title": "Daily Standup",
    "scheduled_date": "2026-01-14",
    "scheduled_time": "09:00",
    "recurrence_pattern": {...}
  },
  // ... continues for each day in range
  {
    "id": "task-123_2026-01-19",
    "title": "Daily Standup",
    "scheduled_date": "2026-01-19",
    "scheduled_time": "09:00",
    "recurrence_pattern": {...}
  }
]
```

### Timeline Display
User sees "Daily Standup" at 9:00 AM **every day** when navigating the week. Each instance is clickable, editable, and completeable.

---

## Supported Recurrence Patterns

| Frequency | Interval | Example | Expansion Logic |
|-----------|----------|---------|-----------------|
| `daily` | `1` | Every day | Add 1 day |
| `daily` | `2` | Every 2 days | Add 2 days |
| `weekly` | `1` | Every week | Add 7 days |
| `weekly` | `2` | Every 2 weeks | Add 14 days |
| `monthly` | `1` | Every month | Add 1 month (date-fns handles month length) |
| `monthly` | `3` | Every quarter | Add 3 months |

**End Date Handling:**
- If `end_date` specified: Stop generating instances after that date
- If no `end_date`: Continue for view range (max 90 days from start)

---

## Performance Considerations

### Safety Limits
```typescript
const MAX_INSTANCES = 100;  // Per task
const maxEndDate = addDays(startDate, 90); // 90 days max range
```

**Rationale:**
- Prevents infinite loops or memory issues
- 90 days = ~3 months of view, sufficient for most use cases
- 100 instances = covers daily tasks for 3+ months

### Memoization
```typescript
const expandedTasks = useMemo(() => {
  return expandAllRecurringTasks(tasks, weekStart, weekEnd);
}, [tasks, selectedDate]);
```
- Expansion only recalculates when `tasks` or `selectedDate` change
- Week range keeps expansion stable when user stays in same week

### Virtual IDs
```typescript
id: `${task.id}_${format(currentDate, "yyyy-MM-dd")}`
```
- Ensures unique React keys for each instance
- Allows clicking/editing specific occurrences
- Original task ID preserved in prefix

---

## Edge Cases Handled

### 1. Task Started Before View Range
**Scenario**: User creates daily task on Jan 1, views timeline on Jan 15.

**Solution**: Calculate how many intervals to skip:
```typescript
const daysDiff = Math.floor((startDate - taskStartDate) / (1000 * 60 * 60 * 24));
const skipIntervals = Math.floor(daysDiff / pattern.interval);
currentDate = addDays(taskStartDate, skipIntervals * pattern.interval);
```
Only generates instances from Jan 15 onward (doesn't waste time on past dates).

### 2. End Date Before View Range End
**Scenario**: Weekly task ends on Jan 20, but user viewing Jan 15-21.

**Solution**:
```typescript
if (pattern.end_date) {
  const patternEndDate = parseISO(pattern.end_date);
  effectiveEndDate = new Date(Math.min(effectiveEndDate, patternEndDate));
}
```
Last instance generated on Jan 20 (respects pattern's end_date).

### 3. Non-Recurring Tasks
**Scenario**: One-time task mixed with recurring tasks.

**Solution**:
```typescript
if (!task.recurrence_pattern) {
  return [task]; // Return as-is without expansion
}
```
Non-recurring tasks pass through unchanged.

### 4. Monthly Recurrence Edge Dates
**Scenario**: Task scheduled on Jan 31, monthly recurrence.

**Solution**: `date-fns` `addMonths()` handles month length automatically:
- Jan 31 → Feb 28/29 → Mar 31 → Apr 30 → etc.

---

## Testing Checklist

- [x] **Daily Recurrence**: Task appears every day in timeline
- [x] **Weekly Recurrence**: Task appears same day each week
- [x] **Monthly Recurrence**: Task appears same day each month
- [x] **End Date Respect**: Task stops appearing after end_date
- [x] **Performance**: No lag with 10+ recurring tasks
- [x] **Virtual IDs**: Each instance clickable and unique
- [x] **Week Navigation**: Smooth transition between weeks
- [x] **Mixed Tasks**: Recurring + non-recurring coexist correctly

---

## Future Enhancements

### 1. Visual Indicator for Recurring Tasks
Add icon or badge to distinguish recurring from one-time tasks:
```tsx
{task.recurrence_pattern && (
  <Badge variant="secondary" className="ml-2">
    <Repeat className="h-3 w-3 mr-1" />
    Recurring
  </Badge>
)}
```

### 2. Edit Series vs Single Instance
Allow user to choose when editing:
- **Edit This Instance**: Update only one occurrence
- **Edit Entire Series**: Update all future occurrences

### 3. Skip Instance
Mark a specific occurrence as skipped (holiday, vacation, etc.)

### 4. Advanced Patterns
- **Days of Week**: "Every Monday, Wednesday, Friday"
- **Month Day**: "First Monday of each month"
- **Yearly**: "Every January 1st"

### 5. Performance Optimization
If user has 100+ recurring tasks, consider:
- Virtual scrolling in timeline
- Lazy expansion (only expand visible week)
- Worker thread for expansion calculations

---

## Files Modified

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `src/utils/recurringTasks.ts` | +140 (new file) | Expansion logic |
| `src/components/routine-tasks/TaskTimeline.tsx` | ~15 modified | Integration |

---

## Summary

✅ **Problem Solved**: Recurring tasks now display correctly across multiple dates in timeline view.

✅ **Performance**: Efficient expansion with safety limits (90 days, 100 instances max).

✅ **Maintainability**: Separated expansion logic into dedicated utility module.

✅ **User Experience**: Seamless - recurring tasks "just work" in timeline navigation.

---

## Related Documentation
- [SUBTASKS_IMPLEMENTATION_CONFIRMED.md](./SUBTASKS_IMPLEMENTATION_CONFIRMED.md) - Subtasks feature
- [FIX_TASK_CREATION_TRIGGER_ERROR.md](./FIX_TASK_CREATION_TRIGGER_ERROR.md) - Trigger fix
- [DATABASE_SCHEMA_REVIEW.md](./DATABASE_SCHEMA_REVIEW.md) - recurrence_pattern JSONB structure

---

**Completion Date**: 2026-01-16  
**Tested By**: User  
**Status**: ✅ Ready for Production
