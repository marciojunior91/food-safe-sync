# Sprint 2 - Master Plan
**Created**: January 10, 2026  
**Sprint Duration**: 2-3 weeks  
**Status**: 📋 Planning

---

## 📊 Sprint 1 Completion Summary

### ✅ Completed in Sprint 1
1. **Remove "Safe" tags from products** ✅
2. **Configure Zebra as default printer in production** ✅
3. **Remove organization data from labels** ✅
4. **Adjust label dimensions to 5cm x 5cm** ✅
5. **Recipe subcategory under Prepared Foods** ✅
6. **Recipe printing integration** ✅
7. **Remove drafts module** ✅ (pre-completed)
8. **Customizable categories and subcategories** ✅
9. **Standard templates** ✅
10. **Remove team member duplication** ✅

### 🔧 Partially Complete
- **Recipes in QuickPrint subcategory** ✅ (completed January 10)
- **Recipe print queue support** ✅ (completed January 10)
- **Printer selector in all 3 workflows** ⚠️ (needs verification)

---

## 🎯 Sprint 2 - Core Objectives

### Module 1: People & Authentication
**Priority**: HIGH  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Email Invitations via Edge Function**
   - Create/update edge function for user invitations
   - Associate users with roles and departments on invite
   - Credentials to setup:
     - COOK: cooktampaapp@hotmail.com / TAMPAPP123
     - BARISTA: baristatampaapp@hotmail.com / TAMPAPP123
     - LEADER_CHEF: leadercheftampaapp@gmail.com / TAMPAAPP123
     - MANAGER: admtampaapp@hotmail.com / TAMPAAPP123

2. **Team Member Profile Integration**
   - Link team members to auth profiles
   - Associate with departments during creation
   - Update team member creation flow

**Deliverables**:
- [ ] Edge function for email invites
- [ ] User creation with role/department assignment
- [ ] Test accounts created and verified
- [ ] Documentation for invite process

---

### Module 2: Labelling Enhancements
**Priority**: MEDIUM  
**Estimated Time**: 1-2 days

#### Tasks:
1. **Verify Printer Selector in All 3 Workflows**
   - QuickPrint flow ✅ (has printer selector)
   - Form-based label creation (verify)
   - Recipe printing ✅ (added printer selector)
   - Print queue (verify)

2. **Final Verification**
   - Test each workflow end-to-end
   - Ensure Zebra is locked in production
   - Verify 5cm x 5cm dimensions
   - Confirm no org data on labels

**Deliverables**:
- [ ] Printer selector verification document
- [ ] End-to-end testing checklist
- [ ] Bug fixes if any issues found

---

### Module 3: Routine Tasks - Complete Overhaul
**Priority**: VERY HIGH  
**Estimated Time**: 5-7 days

#### Phase 1: Timeline View Implementation
- [ ] Execute TIME_LINE_VIEW_PLAN
- [ ] Create timeline UI component
- [ ] Horizontal day/week/month views
- [ ] Drag-and-drop task scheduling

#### Phase 2: Core Functionality Changes
1. **Schedule Time Flexibility**
   - Make schedule_time optional (nullable)
   - Add "flexible" flag for all-day tasks
   - Tasks can be completed anytime during selected day
   - UI toggle: "Specific Time" vs "Anytime Today"

2. **Recurrence System Revamp**
   - Radio buttons: Daily, Weekly, Monthly
   - Replace current recurrence logic
   - Store recurrence pattern in task metadata
   - Auto-generate future task instances

3. **Task Types & Descriptions**
   - Prep List (cook/barista can edit)
   - Stock Take
   - Others (with description field)
   - Add `task_type` enum column
   - Add `task_description` text field

4. **Sub-tasks Checklist**
   - Add `sub_tasks` JSONB column
   - Store as array of {text: string, completed: boolean}
   - Checkbox UI for each sub-task
   - Track sub-task completion percentage

5. **Finished Session**
   - Add "Finish Session" button
   - Marks all tasks in current shift as reviewed
   - Creates session completion record
   - Shows completion summary

6. **Permissions**
   - Admins: Full edit access to all tasks
   - Cook/Barista: Can edit Prep List tasks only
   - Everyone: Can mark tasks complete

7. **Activity History Review**
   - Audit log for all task changes
   - Show who completed/edited/created tasks
   - Filter by date, user, task type
   - Export history to CSV

**Database Schema Changes**:
```sql
-- Migration: Routine Tasks Overhaul
ALTER TABLE routine_tasks 
  ALTER COLUMN schedule_time DROP NOT NULL,
  ADD COLUMN is_flexible BOOLEAN DEFAULT false,
  ADD COLUMN task_type TEXT CHECK (task_type IN ('prep_list', 'stock_take', 'other')),
  ADD COLUMN task_description TEXT,
  ADD COLUMN sub_tasks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  ADD COLUMN recurrence_config JSONB;

-- Session completion tracking
CREATE TABLE task_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  completed_by UUID REFERENCES team_members(id) NOT NULL,
  session_date DATE NOT NULL,
  shift TEXT,
  total_tasks INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL,
  completion_rate DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity history
CREATE TABLE routine_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES routine_tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'completed', 'deleted'
  changed_by UUID REFERENCES team_members(id),
  changes JSONB, -- Store what changed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI Components**:
- TimelineView.tsx (horizontal calendar)
- TaskTypeSelector.tsx (radio buttons)
- SubTasksChecklist.tsx (nested checkboxes)
- FinishSessionDialog.tsx (summary + notes)
- ActivityHistoryPanel.tsx (audit log)
- RecurrenceConfig.tsx (daily/weekly/monthly setup)

**Deliverables**:
- [ ] Timeline view component
- [ ] Flexible scheduling system
- [ ] Recurrence radio buttons
- [ ] Task types with descriptions
- [ ] Sub-tasks checklist
- [ ] Finish session feature
- [ ] Admin-only edit permissions
- [ ] Activity history viewer
- [ ] Database migrations
- [ ] Full testing suite

---

### Module 4: Feed/Communication Module
**Priority**: HIGH  
**Estimated Time**: 4-5 days

#### Inspiration: ConnectTeam
**Benchmark Features**:
- Post/notification feed
- Channel-based communication
- General channel for all
- @mentions support
- Pin important posts
- React to posts (emoji reactions)
- Filter by channel

#### Implementation Plan

**Phase 1: Data Model**
```sql
-- Feed channels
CREATE TABLE feed_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_general BOOLEAN DEFAULT false,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed posts
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  channel_id UUID REFERENCES feed_channels(id),
  author_id UUID REFERENCES team_members(id) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  mentions UUID[], -- Array of team member IDs
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post reactions
CREATE TABLE feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES team_members(id) NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

-- Post comments
CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES team_members(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Phase 2: Core Features**
1. **User Selection on Module Entry**
   - Show UserSelectionDialog when accessing Feed
   - Store selected user in context
   - Use for post authorship

2. **New Post Button**
   - Floating action button (bottom-right)
   - Dialog with:
     - Channel selector dropdown (or "General")
     - Rich text editor for content
     - @mention autocomplete
     - Attachment upload (optional)
     - Post/Cancel buttons

3. **Feed Display**
   - Filter by channel (tabs or dropdown)
   - Reverse chronological order
   - Pinned posts at top
   - Post card shows:
     - Author avatar + name
     - Timestamp
     - Content (with @mentions highlighted)
     - Reactions bar
     - Comment count
     - Pin icon (if pinned)

4. **Interactions**
   - React with emoji (picker dialog)
   - Comment on post
   - Pin post (admin/manager only)
   - Delete post (author or admin)
   - Edit post (author only, within 15 min)

**UI Components**:
- Feed.tsx (main page)
- FeedChannelTabs.tsx
- PostCard.tsx
- NewPostDialog.tsx
- PostReactions.tsx
- PostComments.tsx
- MentionInput.tsx (with autocomplete)

**Deliverables**:
- [ ] Database schema for feed
- [ ] User selection on module entry
- [ ] Channel management UI
- [ ] New post creation
- [ ] Feed display with filtering
- [ ] Emoji reactions
- [ ] Comments system
- [ ] @mentions support
- [ ] Pin functionality
- [ ] RLS policies for security

---

### Module 5: Expiring Soon Enhancements
**Priority**: MEDIUM  
**Estimated Time**: 2-3 days

#### Tasks:
1. **QR Code Scanner**
   - Add "Scan Label" button
   - Open camera scanner (use existing QR scan logic)
   - Scan printed label QR code
   - Auto-mark as expired/discarded
   - Record disposal reason

2. **Manual Expiry Buttons**
   - Add "Mark Expired" button to each product card
   - Add "Discard" button
   - Confirmation dialog with reason field
   - Update label status in database

**UI Changes**:
```tsx
// Expiring Soon page
<Button onClick={openScanner}>
  <QrCode className="mr-2" />
  Scan Label to Expire
</Button>

// Product card actions
<Button variant="destructive" onClick={() => handleExpire(product)}>
  Mark Expired
</Button>
<Button variant="outline" onClick={() => handleDiscard(product)}>
  Discard
</Button>
```

**Database Schema**:
```sql
-- Add status tracking to printed_labels
ALTER TABLE printed_labels
  ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'discarded')),
  ADD COLUMN disposal_reason TEXT,
  ADD COLUMN disposed_at TIMESTAMPTZ,
  ADD COLUMN disposed_by UUID REFERENCES team_members(id);
```

**Deliverables**:
- [ ] QR scanner integration
- [ ] Manual expiry buttons
- [ ] Disposal tracking
- [ ] Confirmation dialogs
- [ ] Database migration
- [ ] Audit trail

---

### Module 6: Onboarding Flow
**Priority**: LOW (Future Sprint)  
**Estimated Time**: 5-7 days

#### Vision: Multi-Location Setup

**Phase 1: Organization Type Selection**
```tsx
// First screen
"What type of business are you?"
○ Single Restaurant
○ Franchise/Multi-Location
○ Restaurant Group
```

**Phase 2: Structural Journey (Loop-based)**
```tsx
// If multi-location selected
Step 1: Create Organization Group
  - Group name
  - Parent company details
  
Step 2: Add Locations (loop)
  - Location name
  - Address
  - Type (franchise/owned)
  - Manager contact
  - [+ Add Another Location] or [Continue]
  
Step 3: Setup Departments (per location)
  - Kitchen, Front of House, Management
  - Assign initial team members
  
Step 4: Configure Defaults
  - Categories for this location type
  - Standard recipes (if applicable)
  - Label templates
```

**Database Schema**:
```sql
-- Organization groups
CREATE TABLE organization_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update organizations table
ALTER TABLE organizations
  ADD COLUMN group_id UUID REFERENCES organization_groups(id),
  ADD COLUMN location_type TEXT CHECK (location_type IN ('single', 'franchise', 'owned', 'corporate'));

-- Franchise permissions
CREATE TABLE franchise_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  group_id UUID REFERENCES organization_groups(id),
  role TEXT CHECK (role IN ('super_user', 'executive_chef', 'regional_manager')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features**:
- Listbox to select franchise locations (super users)
- Switch between locations (multi-org support)
- Aggregate reports across locations
- Shared recipe library
- Template inheritance

**Deliverables**:
- [ ] Organization type selection
- [ ] Multi-location setup wizard
- [ ] Organization group management
- [ ] Location switcher UI
- [ ] Franchise permissions system
- [ ] Cross-location reporting

---

## 📅 Sprint 2 Timeline

### Week 1: Core Modules
- **Day 1-2**: People & Authentication (email invites)
- **Day 3-4**: Routine Tasks Phase 1 (timeline view)
- **Day 5**: Labelling verification & fixes

### Week 2: Advanced Features
- **Day 6-8**: Routine Tasks Phase 2 (flexibility, types, sub-tasks)
- **Day 9-10**: Feed Module Phase 1 (data model, basic posts)

### Week 3: Polish & Testing
- **Day 11-12**: Feed Module Phase 2 (reactions, comments)
- **Day 13-14**: Expiring Soon enhancements
- **Day 15**: Testing, bug fixes, documentation

---

## 🧪 Testing Checklist

### Module 1: People
- [ ] Edge function creates users with correct roles
- [ ] All test accounts accessible
- [ ] Department assignment works
- [ ] Profile linking functional

### Module 2: Labelling
- [ ] Printer selector in all 3 workflows
- [ ] Zebra locked in production
- [ ] 5cm labels print correctly
- [ ] No org data on labels
- [ ] Recipes print from QuickPrint

### Module 3: Routine Tasks
- [ ] Timeline view displays correctly
- [ ] Flexible scheduling works
- [ ] Recurrence creates future tasks
- [ ] Task types function properly
- [ ] Sub-tasks track completion
- [ ] Finish session creates record
- [ ] Permissions enforced correctly
- [ ] Activity history complete

### Module 4: Feed
- [ ] User selection on entry
- [ ] Posts create successfully
- [ ] Channel filtering works
- [ ] Reactions add/remove
- [ ] Comments thread properly
- [ ] @mentions notify users
- [ ] Pin/unpin works (admin only)

### Module 5: Expiring Soon
- [ ] QR scanner opens and reads labels
- [ ] Manual expiry marks labels correctly
- [ ] Disposal reasons recorded
- [ ] Audit trail complete

---

## 🎯 Success Criteria

### Must Have (Sprint 2)
✅ Email invitations working  
✅ Routine tasks completely overhauled  
✅ Feed module functional  
✅ Expiring soon has expiry actions  
✅ All labelling workflows verified  

### Nice to Have (Sprint 2)
⭐ Feed reactions and comments  
⭐ Timeline view drag-and-drop  
⭐ Activity history export  

### Future (Sprint 3+)
🔮 Onboarding flow  
🔮 Multi-location support  
🔮 Franchise management  

---

## 🚀 Getting Started

```bash
# Create Sprint 2 branch
git checkout -b sprint-2-core-modules

# Install any new dependencies
npm install

# Run database migrations (as we create them)
# Each module will have its own migration file

# Start development
npm run dev
```

---

## 📝 Notes

- Sprint 1 completed 10/10 tasks ahead of schedule
- Hardware testing (Zebra printer) deferred to user's timeline
- Focus on backend/database changes for routine tasks
- Feed module inspired by ConnectTeam
- Onboarding is lowest priority - can move to Sprint 3

---

**Created by**: Development Team  
**Approved by**: Product Owner  
**Start Date**: January 11, 2026  
**Target Completion**: January 31, 2026
