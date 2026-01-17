# Iteration 13 - Quick Start Guide

## 🚀 Getting Started

This guide will help you begin implementing the three integrated modules: **Routine Tasks**, **Feed**, and **People**.

---

## 📋 Prerequisites

Before starting, ensure you have:
- [x] Completed Iteration 11 & 12 (Labeling module)
- [x] Access to Supabase dashboard
- [x] Understanding of the current codebase structure
- [x] Review of [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

---

## 🎯 Phase 1 - Foundation (Start Here)

### Step 1: Database Schema Setup

#### 1.1 Create Migration File
```bash
# Create new migration in Supabase
cd supabase/migrations
# Create file: 20241227000000_iteration_13_foundation.sql
```

#### 1.2 Update `profiles` Table
```sql
-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'cook',
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address JSONB,
ADD COLUMN IF NOT EXISTS admission_date DATE,
ADD COLUMN IF NOT EXISTS tfn_number TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pin_change TIMESTAMP;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_employment_status ON profiles(employment_status);

-- Add check constraints
ALTER TABLE profiles
ADD CONSTRAINT check_role CHECK (role IN ('cook', 'barista', 'leader_chef', 'owner', 'admin'));
```

#### 1.3 Create New Tables

See [DATABASE_SCHEMA.sql](./DATABASE_SCHEMA.sql) for full schema.

### Step 2: Module Renaming

#### 2.1 Rename Files
```bash
# Rename DailyRoutines to RoutineTasks
mv src/pages/DailyRoutines.tsx src/pages/RoutineTasks.tsx

# Rename Notifications to Feed
mv src/pages/Notifications.tsx src/pages/Feed.tsx
```

#### 2.2 Update Routes
File: `src/App.tsx` or your routing configuration
```typescript
// OLD
<Route path="/daily-routines" element={<DailyRoutines />} />
<Route path="/notifications" element={<Notifications />} />

// NEW
<Route path="/routine-tasks" element={<RoutineTasks />} />
<Route path="/feed" element={<Feed />} />
```

#### 2.3 Update Navigation
File: `src/components/Navigation.tsx` (or wherever navigation is defined)
```typescript
// Update menu items
{
  name: 'Routine Tasks', // was: Daily Routines
  path: '/routine-tasks',
  icon: CheckSquare
},
{
  name: 'Feed', // was: Notifications
  path: '/feed',
  icon: Bell
}
```

### Step 3: TypeScript Types

Create type definition files:

#### `src/types/routineTasks.ts`
```typescript
export type TaskType = 
  | 'cleaning_daily'
  | 'cleaning_weekly'
  | 'temperature'
  | 'opening'
  | 'closing'
  | 'maintenance'
  | 'others';

export type TaskPriority = 'critical' | 'important' | 'normal';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'skipped';

export interface RoutineTask {
  id: string;
  organization_id: string;
  template_id?: string;
  title: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  scheduled_date: string;
  scheduled_time?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  skip_reason?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  recurrence_pattern?: RecurrencePattern;
  created_at: string;
  updated_at: string;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  days?: number[]; // 0-6 for days of week
  end_date?: string;
}

export interface TaskTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  task_type: TaskType;
  is_default: boolean;
  tasks: TemplateTask[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateTask {
  title: string;
  description?: string;
  estimated_minutes?: number;
  requires_approval?: boolean;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
  uploaded_at: string;
  metadata?: {
    timestamp?: string;
    geolocation?: {
      lat: number;
      lng: number;
    };
  };
}
```

#### `src/types/feed.ts`
```typescript
export type FeedType = 
  | 'task_delegated'
  | 'pending_docs'
  | 'custom_note'
  | 'maintenance';

export type FeedChannel = 
  | 'general'
  | 'baristas'
  | 'cooks'
  | 'maintenance';

export type FeedPriority = 'critical' | 'high' | 'normal' | 'low';

export interface FeedItem {
  id: string;
  organization_id: string;
  type: FeedType;
  channel: FeedChannel;
  title: string;
  message: string;
  priority: FeedPriority;
  created_by?: string;
  target_user_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface FeedRead {
  id: string;
  feed_item_id: string;
  user_id: string;
  read_at: string;
  acknowledged: boolean;
}
```

#### `src/types/people.ts`
```typescript
export type UserRole = 
  | 'cook'
  | 'barista'
  | 'leader_chef'
  | 'owner'
  | 'admin';

export type EmploymentStatus = 
  | 'active'
  | 'on_leave'
  | 'terminated';

export interface UserProfile {
  user_id: string;
  organization_id: string;
  display_name: string;
  role: UserRole;
  position?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: UserAddress;
  admission_date?: string;
  tfn_number?: string;
  employment_status: EmploymentStatus;
  profile_completion_percentage: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface UserPin {
  id: string;
  user_id: string;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  issue_date?: string;
  expiration_date?: string;
  issuing_organization?: string;
  status: 'active' | 'expired' | 'pending_renewal';
  created_at: string;
  updated_at: string;
}
```

### Step 4: Create Hooks

#### `src/hooks/useRoutineTasks.ts`
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { RoutineTask, TaskTemplate } from '@/types/routineTasks';

export function useRoutineTasks() {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // TODO: Implement methods
  const fetchTasks = async () => {};
  const createTask = async (task: Partial<RoutineTask>) => {};
  const updateTask = async (id: string, updates: Partial<RoutineTask>) => {};
  const deleteTask = async (id: string) => {};
  const completeTask = async (id: string, notes?: string) => {};

  return {
    tasks,
    templates,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask
  };
}
```

#### `src/hooks/useFeed.ts`
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { FeedItem, FeedChannel } from '@/types/feed';

export function useFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // TODO: Implement methods
  const fetchFeed = async (channel?: FeedChannel) => {};
  const createFeedItem = async (item: Partial<FeedItem>) => {};
  const markAsRead = async (itemId: string) => {};
  const acknowledge = async (itemId: string) => {};

  return {
    feedItems,
    loading,
    fetchFeed,
    createFeedItem,
    markAsRead,
    acknowledge
  };
}
```

#### `src/hooks/usePeople.ts`
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { UserProfile, UserDocument } from '@/types/people';

export function usePeople() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // TODO: Implement methods
  const fetchUsers = async () => {};
  const createUser = async (user: Partial<UserProfile>) => {};
  const updateUser = async (id: string, updates: Partial<UserProfile>) => {};
  const deleteUser = async (id: string) => {};
  const verifyPIN = async (userId: string, pin: string) => {};
  const uploadDocument = async (userId: string, document: FormData) => {};

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    verifyPIN,
    uploadDocument
  };
}
```

---

## 📝 Next Steps

1. **Review the Implementation Plan** - Read the full plan in `IMPLEMENTATION_PLAN.md`
2. **Set Up Database** - Run the migration scripts
3. **Update Types** - Create the TypeScript type files
4. **Create Hooks** - Implement the data fetching hooks
5. **Build Components** - Start with the core UI components
6. **Test Integration** - Ensure modules work together

---

## 🔍 Testing Checklist

- [ ] Database migrations run successfully
- [ ] Module names updated in navigation
- [ ] Routes working correctly
- [ ] TypeScript types compile without errors
- [ ] Hooks return expected data structure
- [ ] No console errors on page load

---

## 📚 Resources

- [Main Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Database Schema](./DATABASE_SCHEMA.sql)
- [Component Architecture](./COMPONENT_ARCHITECTURE.md)
- [API Documentation](./API_DOCS.md)

---

**Ready to start?** Begin with Step 1: Database Schema Setup!
