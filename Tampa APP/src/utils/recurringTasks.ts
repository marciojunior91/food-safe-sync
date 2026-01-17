import { addDays, addWeeks, addMonths, parseISO, isAfter, isBefore, format } from "date-fns";
import { RoutineTask } from "@/types/routineTasks";

/**
 * Expands a recurring task into multiple instances for a date range
 * @param task - The recurring task to expand
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of task instances with adjusted scheduled_date
 */
export function expandRecurringTask(
  task: RoutineTask,
  startDate: Date,
  endDate: Date
): RoutineTask[] {
  // If task is not recurring, return as-is
  if (!task.recurrence_pattern) {
    return [task];
  }

  const pattern = task.recurrence_pattern as {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    end_date?: string;
  };

  const instances: RoutineTask[] = [];
  const taskStartDate = parseISO(task.scheduled_date);
  
  // Determine actual start date (max of task start and range start)
  let currentDate = new Date(
    Math.max(taskStartDate.getTime(), startDate.getTime())
  );

  // Determine end date (min of pattern end, range end, or 90 days from start)
  const maxEndDate = addDays(startDate, 90); // Limit to 90 days for performance
  let effectiveEndDate = new Date(
    Math.min(endDate.getTime(), maxEndDate.getTime())
  );

  if (pattern.end_date) {
    const patternEndDate = parseISO(pattern.end_date);
    effectiveEndDate = new Date(
      Math.min(effectiveEndDate.getTime(), patternEndDate.getTime())
    );
  }

  // Adjust currentDate to first occurrence in range
  if (isBefore(taskStartDate, startDate)) {
    // Calculate how many intervals to skip
    const daysDiff = Math.floor(
      (startDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (pattern.frequency === 'daily') {
      const skipIntervals = Math.floor(daysDiff / pattern.interval);
      currentDate = addDays(taskStartDate, skipIntervals * pattern.interval);
    } else if (pattern.frequency === 'weekly') {
      const skipIntervals = Math.floor(daysDiff / (7 * pattern.interval));
      currentDate = addWeeks(taskStartDate, skipIntervals * pattern.interval);
    } else if (pattern.frequency === 'monthly') {
      const monthsDiff = Math.floor(daysDiff / 30);
      const skipIntervals = Math.floor(monthsDiff / pattern.interval);
      currentDate = addMonths(taskStartDate, skipIntervals * pattern.interval);
    }

    // If we're still before range start, advance one more interval
    while (isBefore(currentDate, startDate)) {
      currentDate = addInterval(currentDate, pattern.frequency, pattern.interval);
    }
  }

  // Generate instances
  let count = 0;
  const MAX_INSTANCES = 100; // Safety limit

  while (
    !isAfter(currentDate, effectiveEndDate) &&
    count < MAX_INSTANCES
  ) {
    // Create instance for this date - preserve ALL properties including scheduled_time
    // IMPORTANT: Keep original task ID for database operations (attachments, comments, etc.)
    const instance: RoutineTask = {
      ...task,
      scheduled_date: format(currentDate, "yyyy-MM-dd"),
      // Explicitly preserve scheduled_time (should be copied by spread but making sure)
      scheduled_time: task.scheduled_time,
      // Add metadata to identify this is a recurring instance
      // Using a custom property that won't conflict with database operations
      _recurringInstanceDate: format(currentDate, "yyyy-MM-dd"),
    } as RoutineTask & { _recurringInstanceDate?: string };

    instances.push(instance);
    count++;

    // Move to next occurrence
    currentDate = addInterval(currentDate, pattern.frequency, pattern.interval);
  }

  return instances;
}

/**
 * Helper function to add interval based on frequency
 */
function addInterval(
  date: Date,
  frequency: 'daily' | 'weekly' | 'monthly',
  interval: number
): Date {
  switch (frequency) {
    case 'daily':
      return addDays(date, interval);
    case 'weekly':
      return addWeeks(date, interval);
    case 'monthly':
      return addMonths(date, interval);
    default:
      return date;
  }
}

/**
 * Expands all recurring tasks in an array
 * @param tasks - Array of tasks (recurring and non-recurring)
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array with all tasks expanded
 */
export function expandAllRecurringTasks(
  tasks: RoutineTask[],
  startDate: Date,
  endDate: Date
): RoutineTask[] {
  const expanded: RoutineTask[] = [];

  tasks.forEach((task) => {
    const instances = expandRecurringTask(task, startDate, endDate);
    expanded.push(...instances);
  });

  return expanded;
}
