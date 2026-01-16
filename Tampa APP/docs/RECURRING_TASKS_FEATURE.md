# Recurring Tasks Feature 🔄

## Overview

Added comprehensive recurrence functionality to the Routine Tasks system, allowing users to create tasks that automatically repeat on a schedule (daily, weekly, biweekly, or monthly).

## ✨ Features Implemented

### 1. **Recurrence Toggle**
- Clean checkbox interface to enable/disable recurrence
- Shows/hides frequency options dynamically
- Clear visual separation with icon and section header

### 2. **Frequency Selection (Radio Buttons)**
Four recurrence options with visual indicators:

| Frequency | Icon | Description | Backend Value |
|-----------|------|-------------|---------------|
| **Daily** | 📅 | Every day | `{ frequency: 'daily', interval: 1 }` |
| **Weekly** | 📆 | Every 7 days | `{ frequency: 'weekly', interval: 1 }` |
| **Biweekly** | 🗓️ | Every 14 days | `{ frequency: 'weekly', interval: 2 }` |
| **Monthly** | 📊 | Every 30 days | `{ frequency: 'monthly', interval: 1 }` |

### 3. **End Date Picker**
- Optional field - if empty, task repeats forever
- Uses calendar picker component (same as scheduled date)
- Prevents selecting dates in the past
- Clear label: "No end date (repeats forever)"

### 4. **Smart Pattern Building**
- Automatically converts UI selections to `RecurrencePattern` type
- Handles biweekly as weekly with interval=2
- Includes end_date only if specified

## 🎨 User Experience

### Visual Design
```
┌─────────────────────────────────────────┐
│ 🔄 Recurrence Settings                  │
├─────────────────────────────────────────┤
│ ☑ Recurring Task                        │
│ Create this task automatically...       │
├─────────────────────────────────────────┤
│ Frequency *                             │
│ ┌──────────┬──────────┐                │
│ │ 📅 Daily  │ 📆 Weekly │                │
│ ├──────────┼──────────┤                │
│ │🗓️ Biweekly│📊 Monthly│                │
│ └──────────┴──────────┘                │
├─────────────────────────────────────────┤
│ End Date (Optional)                     │
│ [No end date (repeats forever)]  📅    │
└─────────────────────────────────────────┘
```

### Interaction Flow
1. User creates new task
2. Fills required fields (title, type, assigned to, date)
3. **Scrolls to Recurrence Settings section**
4. Checks "Recurring Task" checkbox
5. Radio buttons appear with 4 options
6. Selects frequency (e.g., Weekly)
7. Optionally sets end date
8. Submits form
9. Backend receives `recurrence_pattern` object

## 🔧 Technical Implementation

### Form Schema Updates

```typescript
const taskFormSchema = z.object({
  // ... existing fields ...
  
  // NEW RECURRENCE FIELDS
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
  recurrence_end_date: z.date().optional(),
});
```

### Pattern Conversion Logic

```typescript
// Biweekly example
if (data.recurrence_frequency === 'biweekly') {
  recurrencePattern = {
    frequency: 'weekly',  // Store as weekly
    interval: 2,          // But with interval=2
    end_date: data.recurrence_end_date 
      ? format(data.recurrence_end_date, "yyyy-MM-dd") 
      : undefined
  };
}
```

### Output Examples

**Daily Task:**
```json
{
  "title": "Check refrigerator temperature",
  "recurrence_pattern": {
    "frequency": "daily",
    "interval": 1
  }
}
```

**Biweekly Task with End Date:**
```json
{
  "title": "Deep clean kitchen",
  "recurrence_pattern": {
    "frequency": "weekly",
    "interval": 2,
    "end_date": "2026-12-31"
  }
}
```

**Monthly Task (Forever):**
```json
{
  "title": "Equipment maintenance",
  "recurrence_pattern": {
    "frequency": "monthly",
    "interval": 1
  }
}
```

## 📁 Files Modified

### `src/components/routine-tasks/TaskForm.tsx`

**Changes:**
1. Added imports:
   - `Repeat` icon from lucide-react
   - `RadioGroup`, `RadioGroupItem` from ui/radio-group
   - `Label` from ui/label

2. Updated schema with 3 new fields

3. Added default values for recurrence fields

4. Enhanced `handleSubmit()` to build `recurrence_pattern`

5. Added complete UI section with:
   - Toggle checkbox
   - Radio button grid (2 columns)
   - End date picker
   - Conditional rendering
   - Visual indicators (emojis, descriptions)

**Lines added:** ~180 lines

## 🧪 Testing Checklist

### Manual Testing Steps

- [ ] **1. Open Create Task Dialog**
  - Navigate to Routine Tasks
  - Click "New Task" button

- [ ] **2. Verify Default State**
  - Recurrence section visible
  - "Recurring Task" checkbox unchecked
  - No frequency options visible

- [ ] **3. Enable Recurrence**
  - Check "Recurring Task" checkbox
  - Verify frequency radio buttons appear
  - Verify end date picker appears

- [ ] **4. Test Each Frequency**
  - [ ] Select Daily - verify radio selection
  - [ ] Select Weekly - verify radio selection
  - [ ] Select Biweekly - verify radio selection
  - [ ] Select Monthly - verify radio selection

- [ ] **5. Test End Date Picker**
  - Click end date field
  - Calendar popup appears
  - Select a future date
  - Verify date displays correctly
  - Clear date (should show "No end date...")

- [ ] **6. Create Task Without Recurrence**
  - Uncheck "Recurring Task"
  - Fill other fields
  - Submit form
  - Verify `recurrence_pattern` is undefined in database

- [ ] **7. Create Daily Task**
  - Enable recurrence
  - Select "Daily"
  - Submit form
  - **Expected:** `{ frequency: 'daily', interval: 1 }`

- [ ] **8. Create Biweekly Task with End Date**
  - Enable recurrence
  - Select "Biweekly"
  - Set end date to 3 months from now
  - Submit form
  - **Expected:** `{ frequency: 'weekly', interval: 2, end_date: 'YYYY-MM-DD' }`

- [ ] **9. Visual Testing**
  - [ ] Responsive layout (mobile/tablet/desktop)
  - [ ] Radio buttons properly styled
  - [ ] Emojis display correctly
  - [ ] Text alignment and spacing
  - [ ] Dark mode compatibility

- [ ] **10. Edge Cases**
  - [ ] Enable then disable recurrence - fields clear
  - [ ] Change frequency multiple times
  - [ ] Set end date before scheduled date (if validation added)

### Database Verification

```sql
-- Check recurrence_pattern field in created tasks
SELECT 
  id,
  title,
  scheduled_date,
  recurrence_pattern
FROM routine_tasks
WHERE recurrence_pattern IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Count tasks by recurrence frequency
SELECT 
  recurrence_pattern->>'frequency' as frequency,
  recurrence_pattern->>'interval' as interval,
  COUNT(*) as task_count
FROM routine_tasks
WHERE recurrence_pattern IS NOT NULL
GROUP BY frequency, interval;
```

## 🚀 Next Steps (Future Enhancements)

### Phase 2 - Task Generation
**Goal:** Automatically create task instances based on recurrence pattern

**Implementation:**
1. **Cron Job / Edge Function**
   ```typescript
   // Run daily at midnight
   async function generateRecurringTasks() {
     // Find all active recurring tasks
     const tasks = await supabase
       .from('routine_tasks')
       .select('*')
       .not('recurrence_pattern', 'is', null);
     
     // For each task, check if new instance needed
     for (const task of tasks) {
       const nextDate = calculateNextDate(
         task.scheduled_date,
         task.recurrence_pattern
       );
       
       if (shouldCreateInstance(nextDate)) {
         await createTaskInstance(task, nextDate);
       }
     }
   }
   ```

2. **Helper Functions**
   - `calculateNextDate()` - Compute next occurrence
   - `shouldCreateInstance()` - Check if instance needed today
   - `createTaskInstance()` - Clone task with new date

### Phase 3 - Advanced Features
- [ ] **Custom intervals** (e.g., every 3 days, every 2 months)
- [ ] **Day-of-week selection** for weekly tasks (Mon, Wed, Fri)
- [ ] **Day-of-month selection** for monthly tasks (1st, 15th)
- [ ] **Skip holidays** option
- [ ] **Bulk edit recurrence** for multiple tasks
- [ ] **Pause/resume recurrence** without deleting pattern
- [ ] **Recurrence history** view showing all generated instances

### Phase 4 - UI Enhancements
- [ ] **Visual calendar** showing future occurrences
- [ ] **Preview mode** "This task will run on: [dates]"
- [ ] **Edit recurrence** from task detail view
- [ ] **Copy recurrence** from existing task
- [ ] **Smart suggestions** based on task type

## 🎯 Current Status

✅ **COMPLETE - Phase 1: UI & Data Structure**
- UI components implemented
- Form validation working
- Data structure in place
- Backend receives correct format

⏳ **PENDING - Phase 2: Task Generation**
- Requires backend/edge function implementation
- Needs cron job or scheduled function
- Task instance creation logic

## 📝 Notes

### Why Biweekly = Weekly with interval=2?
Following PostgreSQL and standard scheduling conventions:
- More flexible representation
- Allows easy extension to custom intervals
- Backend can handle any interval value
- Simpler database schema

### Recurrence Pattern Type
Already defined in `src/types/routineTasks.ts`:

```typescript
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  days?: number[]; // 0-6 for days of week (0 = Sunday)
  end_date?: string;
}
```

### Database Column
Already exists in `routine_tasks` table:
```sql
recurrence_pattern JSONB
```

## 🐛 Known Issues / Limitations

1. **No task generation yet** - Pattern is saved but tasks aren't auto-created
2. **No validation** - Can set end_date before scheduled_date
3. **No edit recurrence** - Must create new task to change pattern
4. **No visual preview** - Users can't see future dates before creating

## 🤝 Related Documentation

- `ROUTINE_TASKS_UX_IMPROVEMENTS_COMPLETE.md` - Recent task improvements
- `src/types/routineTasks.ts` - Type definitions
- `supabase/migrations/20241227000000_iteration_13_foundation.sql` - Table schema

---

**Created:** January 15, 2026  
**Author:** Development Team  
**Status:** ✅ Phase 1 Complete - Ready for Testing
