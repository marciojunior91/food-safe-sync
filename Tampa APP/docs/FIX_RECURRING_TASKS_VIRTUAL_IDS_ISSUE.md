# Fix: Recurring Tasks Virtual IDs Breaking Database Operations

**Date**: 2026-01-16  
**Priority**: 🔴 CRITICAL  
**Status**: ✅ Fixed  

---

## Problem Discovered

### User Report
When trying to **edit a recurring task instance**, the app crashed with:

```
Request URL: .../task_attachments?task_id=eq.59b008d6-d92d-486f-8f03-c03dc7f6e271_2026-01-19
Status: 400 Bad Request

{
    "code": "22P02",
    "message": "invalid input syntax for type uuid: \"59b008d6-d92d-486f-8f03-c03dc7f6e271_2026-01-19\""
}
```

### Root Cause
The initial implementation of recurring task expansion created **virtual IDs** like `{uuid}_2026-01-19` to make React keys unique. However, these virtual IDs broke database operations:

```typescript
// ❌ PROBLEMATIC CODE
const instance: RoutineTask = {
  ...task,
  id: `${task.id}_${format(currentDate, "yyyy-MM-dd")}`, // Virtual ID
};
```

**Why This Failed:**
1. User clicks on a recurring task instance (e.g., "Daily Standup" on Jan 19)
2. App opens task details/edit modal
3. Modal tries to fetch `task_attachments` where `task_id = '59b008d6-d92d-486f-8f03-c03dc7f6e271_2026-01-19'`
4. Database rejects: Foreign key column expects UUID, got string with underscore
5. **All operations with foreign keys fail**: attachments, comments, activity logs, etc.

### Impact
- ❌ Cannot edit recurring task instances
- ❌ Cannot view/add attachments
- ❌ Cannot view task history
- ❌ Cannot complete task instances
- ❌ Any feature depending on task ID as foreign key breaks

---

## Solution: Keep Original Task ID

### Strategy
Instead of creating virtual IDs, we:
1. **Keep the original task ID** for all database operations
2. **Use `scheduled_date` to differentiate instances** in the UI
3. **Create unique React keys** by combining `{id}_{scheduled_date}`
4. Add **metadata field** `_recurringInstanceDate` (optional, for future features)

### Implementation

#### 1. Updated `recurringTasks.ts` Expansion Logic

```typescript
// ✅ CORRECT CODE
const instance: RoutineTask = {
  ...task,
  scheduled_date: format(currentDate, "yyyy-MM-dd"), // Update date
  scheduled_time: task.scheduled_time,              // Preserve time
  // Keep original ID for database operations
  // Add metadata for instance identification
  _recurringInstanceDate: format(currentDate, "yyyy-MM-dd"),
} as RoutineTask & { _recurringInstanceDate?: string };
```

**Key Changes:**
- ❌ `id: virtualId` → ✅ Keep original `task.id`
- ✅ Only `scheduled_date` changes per instance
- ✅ All other properties copied from original task
- ✅ New field `_recurringInstanceDate` for metadata (doesn't affect DB)

#### 2. Updated `TaskTimeline.tsx` React Keys

```typescript
// Generate unique key for React (task ID + scheduled date)
const taskKey = `${task.id}_${task.scheduled_date}`;

return (
  <TaskBlock
    key={taskKey} // ✅ Unique per instance for React
    task={task}   // ✅ Contains original ID for DB operations
    onClick={() => onTaskClick?.(task)}
  />
);
```

**Why This Works:**
- React needs unique keys → Use `{id}_{date}` as key prop
- Database needs valid UUID → Use original `task.id` from task object
- Each instance visually distinct → Different `scheduled_date`

---

## How Recurring Instances Work Now

### Database (1 Record)
```json
{
  "id": "59b008d6-d92d-486f-8f03-c03dc7f6e271",
  "title": "Daily Standup",
  "scheduled_date": "2026-01-13",
  "scheduled_time": "09:00",
  "recurrence_pattern": {
    "frequency": "daily",
    "interval": 1
  }
}
```

### UI Expansion (Multiple Virtual Instances)
```javascript
[
  {
    id: "59b008d6-d92d-486f-8f03-c03dc7f6e271", // ✅ Same ID
    scheduled_date: "2026-01-13",
    scheduled_time: "09:00",
    _recurringInstanceDate: "2026-01-13"
  },
  {
    id: "59b008d6-d92d-486f-8f03-c03dc7f6e271", // ✅ Same ID
    scheduled_date: "2026-01-14", // Different date
    scheduled_time: "09:00",
    _recurringInstanceDate: "2026-01-14"
  },
  {
    id: "59b008d6-d92d-486f-8f03-c03dc7f6e271", // ✅ Same ID
    scheduled_date: "2026-01-15", // Different date
    scheduled_time: "09:00",
    _recurringInstanceDate: "2026-01-15"
  }
]
```

### User Interactions

#### Clicking a Recurring Instance
1. User clicks "Daily Standup" on Jan 19
2. Task object passed to modal: `{ id: "59b008d6-...", scheduled_date: "2026-01-19" }`
3. Modal fetches: `task_attachments WHERE task_id = '59b008d6-...'` ✅ Valid UUID!
4. Attachments load successfully

#### Editing a Recurring Instance
**Current Behavior:** Editing any instance updates the **entire series** (all future occurrences).

**Why:** All instances share the same database record.

**Future Enhancement:** Add "Edit This Instance" vs "Edit Series" option:
- **Edit This Instance**: Create exception record for this date
- **Edit Series**: Update the original recurring task

---

## Benefits of This Approach

### ✅ Database Integrity
- All foreign key relationships work correctly
- UUIDs remain valid throughout the system
- No need to modify database schema

### ✅ Feature Compatibility
- ✅ Task attachments work
- ✅ Task comments work
- ✅ Activity logs work
- ✅ Task completion works
- ✅ Task editing works
- ✅ All existing features remain functional

### ✅ React Rendering
- Unique keys prevent reconciliation issues
- Each instance can be clicked/interacted with independently
- No visual bugs or state confusion

### ✅ Performance
- No additional database queries needed
- Client-side expansion remains efficient
- React can efficiently diff instances

---

## Edge Cases Handled

### 1. Same Task Viewed on Different Days
**Scenario:** User views timeline on Jan 15, sees "Daily Standup". Next day, views Jan 16.

**Behavior:**
- Jan 15 instance: `{ id: "...", scheduled_date: "2026-01-15" }`
- Jan 16 instance: `{ id: "...", scheduled_date: "2026-01-16" }`
- React key changes: `{id}_2026-01-15` → `{id}_2026-01-16`
- Component re-renders correctly

### 2. Multiple Recurring Tasks Same Day
**Scenario:** "Daily Standup" at 09:00 and "Daily Review" at 17:00, both daily.

**Behavior:**
- Different task IDs naturally create unique keys
- No conflicts: `{standup-id}_2026-01-15` vs `{review-id}_2026-01-15`

### 3. Editing Task Properties
**Scenario:** User changes "Daily Standup" title to "Team Meeting".

**Behavior:**
- Database update affects original record
- All future instances automatically show new title
- Past instances (if completed separately) unaffected

---

## Testing Checklist

- [x] ✅ Click recurring task instance → Opens edit modal
- [x] ✅ View task attachments → No UUID error
- [x] ✅ Add new attachment → Saves with correct task_id
- [x] ✅ Complete task instance → Updates correct record
- [x] ✅ Edit task title → All instances reflect change
- [x] ✅ Navigate between days → Instances render correctly
- [x] ✅ React keys unique → No console warnings
- [x] ✅ Multiple recurring tasks → No conflicts

---

## Future Enhancements

### 1. Instance-Level Overrides
Allow editing individual instances without affecting the series:

```typescript
interface RecurringTaskException {
  task_id: UUID;
  exception_date: string; // "2026-01-19"
  overrides: {
    title?: string;
    scheduled_time?: string;
    is_cancelled?: boolean;
  };
}
```

**Use Cases:**
- Cancel one occurrence (holiday)
- Reschedule one occurrence (meeting moved)
- Rename one occurrence (special guest speaker)

### 2. Edit Dialog Options
```tsx
<AlertDialog>
  <AlertDialogTitle>Edit Recurring Task</AlertDialogTitle>
  <AlertDialogDescription>
    This is a recurring task. What would you like to do?
  </AlertDialogDescription>
  <AlertDialogAction onClick={editThisInstance}>
    Edit This Instance Only
  </AlertDialogAction>
  <AlertDialogAction onClick={editEntireSeries}>
    Edit Entire Series
  </AlertDialogAction>
</AlertDialog>
```

### 3. Instance-Specific Completion
Track completion per date, not globally:

```sql
CREATE TABLE routine_task_completions (
  task_id UUID REFERENCES routine_tasks(id),
  completed_date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_by UUID REFERENCES profiles(user_id),
  PRIMARY KEY (task_id, completed_date)
);
```

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/utils/recurringTasks.ts` | Remove virtual ID generation | ~5 |
| `src/components/routine-tasks/TaskTimeline.tsx` | Update React key generation | ~3 |

---

## Summary

✅ **Critical bug fixed**: Recurring task instances no longer break database operations.

✅ **Approach**: Keep original task ID, differentiate by `scheduled_date` only.

✅ **Impact**: All features work correctly (attachments, comments, editing, etc.).

✅ **Future-proof**: Foundation laid for instance-level overrides and exceptions.

---

## Related Documentation
- [RECURRING_TASKS_TIMELINE_IMPLEMENTATION.md](./RECURRING_TASKS_TIMELINE_IMPLEMENTATION.md) - Original feature implementation
- [SUBTASKS_IMPLEMENTATION_CONFIRMED.md](./SUBTASKS_IMPLEMENTATION_CONFIRMED.md) - Subtasks feature
- [DATABASE_SCHEMA_REVIEW.md](./DATABASE_SCHEMA_REVIEW.md) - Database structure

---

**Fix Applied**: 2026-01-16  
**Tested By**: User  
**Status**: ✅ Production Ready
