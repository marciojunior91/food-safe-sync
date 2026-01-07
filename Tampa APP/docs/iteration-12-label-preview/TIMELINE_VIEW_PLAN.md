# Timeline View for Routine Tasks - Implementation Plan

## Overview
Create a visual timeline view that displays routine tasks as connected boxes, showing daily and weekly patterns.

## Features

### 1. Timeline Layout Options
- **Daily View**: 24-hour timeline showing tasks scheduled throughout the day
- **Weekly View**: 7-day grid showing recurring tasks across the week
- **Month View**: Calendar view with task indicators

### 2. Visual Elements
- **Task Boxes**: Colored blocks representing each task
  - Color-coded by type (cleaning, temperature, opening, closing, etc.)
  - Size reflects estimated duration
  - Shows task title and time
  
- **Connection Lines**: Visual links between related tasks
  - Arrows showing task dependencies
  - Dotted lines for recurring patterns
  - Solid lines for task sequences (e.g., "open → setup → prepare")

- **Time Indicators**:
  - Current time marker (red line)
  - Time slots/grid lines
  - Duration bars

### 3. Interactive Features
- **Drag & Drop**: Reschedule tasks by dragging
- **Click to View**: Open task details
- **Quick Actions**: 
  - Mark complete
  - Skip task
  - Add note
- **Filtering**: Filter by type, priority, assignee
- **Zoom**: Zoom in/out for different time scales

### 4. Pattern Templates
- **Opening Routine**: Chain of tasks for opening the restaurant
- **Closing Routine**: Sequence for closing procedures
- **Daily Cleaning**: Recurring cleaning tasks throughout the day
- **Weekly Deep Clean**: Weekly maintenance tasks
- **Temperature Logs**: Recurring temperature check points

### 5. Smart Scheduling
- **Auto-spacing**: Automatically distribute tasks
- **Conflict Detection**: Warn about overlapping tasks
- **Optimal Ordering**: Suggest task sequences
- **Time Blocks**: Group related tasks into blocks

## Technical Implementation

### New Components Needed
1. `TaskTimeline.tsx` - Main timeline container
2. `TimelineGrid.tsx` - Timeline grid with time slots
3. `TaskBlock.tsx` - Individual task block component
4. `ConnectionLine.tsx` - Lines connecting related tasks
5. `TimelineControls.tsx` - View controls and filters
6. `PatternTemplateSelector.tsx` - Choose routine patterns

### Data Structure Extensions
```typescript
// Add to RoutineTask type
interface RoutineTask {
  // Existing fields...
  
  // New timeline fields
  depends_on?: string[];  // Task IDs this task depends on
  sequence_order?: number;  // Order in a sequence
  pattern_id?: string;  // Reference to a pattern template
  time_block?: string;  // Group tasks into blocks
}

// New pattern template type
interface RoutinePattern {
  id: string;
  name: string;
  description: string;
  task_sequence: {
    task_template_id: string;
    order: number;
    offset_minutes: number;  // Time after previous task
    dependencies: string[];
  }[];
}
```

### UI Layout
```
┌─────────────────────────────────────────────────┐
│  [Daily] [Weekly] [Month]   [+ New Pattern]    │
├─────────────────────────────────────────────────┤
│ 06:00 ──┬────────────────────────────────────  │
│         │ [Opening Checklist] ──→ [Setup]      │
│ 08:00 ──┤                                       │
│         │ [Temperature Log]                     │
│ 10:00 ──┤                                       │
│         │ [Mid-shift Clean]                     │
│ 12:00 ──┤                                       │
│         │ [Lunch Prep] ──→ [Kitchen Check]     │
│ 14:00 ──┤                                       │
│         │ [Temperature Log]                     │
│ 16:00 ──┤                                       │
│         │ [Evening Clean]                       │
│ 18:00 ──┤                                       │
│         │ [Closing] ──→ [Final Check]          │
│ 20:00 ──┴────────────────────────────────────  │
└─────────────────────────────────────────────────┘
```

## Implementation Priority

### Phase 1: Basic Timeline (Now)
- [ ] Create timeline grid component
- [ ] Display tasks on timeline
- [ ] Basic time-based layout
- [ ] Click to view task details

### Phase 2: Visual Enhancements
- [ ] Color coding by task type
- [ ] Duration visualization
- [ ] Current time marker
- [ ] Responsive design for mobile

### Phase 3: Interactions
- [ ] Drag and drop to reschedule
- [ ] Quick complete/skip actions
- [ ] Inline editing
- [ ] Filtering and search

### Phase 4: Patterns & Templates
- [ ] Pattern template system
- [ ] Task connections/dependencies
- [ ] One-click pattern application
- [ ] Pattern library (opening, closing, etc.)

### Phase 5: Smart Features
- [ ] Conflict detection
- [ ] Auto-scheduling suggestions
- [ ] Recurring pattern management
- [ ] Analytics and insights

## Benefits
1. **Visual Clarity**: See entire day/week at a glance
2. **Pattern Recognition**: Identify routine patterns easily
3. **Better Planning**: Optimize task distribution
4. **Team Coordination**: See who's doing what when
5. **Consistency**: Ensure routines are followed
6. **Time Management**: Better estimate workload

## Next Steps
1. Apply the RLS migration to fix current error
2. Get feedback on timeline design preferences
3. Start with Phase 1 implementation
4. Iterate based on real-world usage

Would you like me to start implementing the timeline view right after we fix the RLS issue?
