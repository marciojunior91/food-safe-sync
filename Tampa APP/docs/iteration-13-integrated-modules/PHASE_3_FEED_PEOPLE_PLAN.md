# 🚀 ITERATION 13 - PHASE 3: FEED & PEOPLE MODULES

**Date:** January 1, 2026  
**Status:** 🎯 Ready to Start  
**Duration:** 2-3 Weeks

---

## 📊 Current Status

### ✅ Completed (Phase 1 & 2):
- ✅ **Database Schema** - All tables created with RLS policies
- ✅ **TypeScript Hooks** - useFeed.ts, usePeople.ts (400+ lines each)
- ✅ **Type Definitions** - feed.ts, people.ts complete
- ✅ **Routine Tasks Module** - Fully functional with all features
- ✅ **Navigation** - Routes integrated for /feed and /people
- ✅ **Placeholder Pages** - FeedModule.tsx, PeopleModule.tsx with "Coming Soon"

### 🎯 Phase 3 Goals:
Build complete UI for Feed and People modules using existing hooks

---

## 🔔 FEED MODULE - Implementation Plan

### Overview
Transform the activity feed into a real-time communication and notification center.

### Components to Build (Priority Order):

#### 1. FeedList Component
**File:** `src/components/feed/FeedList.tsx`

**Features:**
- Display feed items in chronological order
- Infinite scroll / pagination
- Real-time updates via Supabase subscriptions
- Pull-to-refresh
- Empty state when no items

**Props:**
```typescript
interface FeedListProps {
  items: FeedItem[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}
```

---

#### 2. FeedCard Component
**File:** `src/components/feed/FeedCard.tsx`

**Features:**
- Display individual feed item
- User avatar and name
- Timestamp (relative: "2 hours ago")
- Feed type badge (info, alert, success, urgent)
- Action buttons (mark as read, delete)
- Expandable content for long messages
- Click to view details

**Feed Type Styling:**
- 🔵 `info` - Blue border/icon
- 🟡 `alert` - Yellow border/icon
- 🟢 `success` - Green border/icon
- 🔴 `urgent` - Red border/icon, bold text

---

#### 3. FeedFilters Component
**File:** `src/components/feed/FeedFilters.tsx`

**Features:**
- Filter by feed type (All, Info, Alert, Success, Urgent)
- Filter by channel (General, Baristas, Cooks, Maintenance)
- Filter by read/unread status
- Date range picker
- Search feed content
- Clear all filters button

---

#### 4. CreateFeedItem Component
**File:** `src/components/feed/CreateFeedItem.tsx`

**Features:**
- Compose new feed message
- Select feed type (info, alert, success, urgent)
- Select target channel(s) or broadcast to all
- Target specific users or roles
- Add attachments (optional for future)
- Priority toggle (normal/urgent)
- Preview before posting
- Character count

**Permissions:**
- **Admin/Owner/Manager** - Can create all types
- **Leader Chef** - Can create for their department
- **Cook/Barista** - Cannot create (view only)

---

#### 5. FeedStats Component
**File:** `src/components/feed/FeedStats.tsx`

**Features:**
- Total unread count
- Unread by type (info, alert, urgent)
- Recent activity graph (last 7 days)
- Most active users
- Response rate metrics

---

### Main Feed Page Structure

**File:** `src/pages/FeedModule.tsx` (replace current placeholder)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Feed                                   │
│  Stay updated with activity             │
├─────────────────────────────────────────┤
│  [Create] [Filter ▼] [🔍 Search]       │
├─────────────────────────────────────────┤
│  📊 Stats: 12 Unread | 3 Urgent         │
├─────────────────────────────────────────┤
│  [All] [Info] [Alert] [Urgent] [Read]  │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐ │
│  │ 🔴 URGENT: Kitchen deep clean      │ │
│  │ Posted by Admin • 2 hours ago      │ │
│  │ Due today at 11 PM                 │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🟢 Task completed: Opening checklist│ │
│  │ Completed by John • 3 hours ago    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🔵 New recipe added to menu         │ │
│  │ Posted by Chef Maria • 5 hours ago │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Load More...]                         │
└─────────────────────────────────────────┘
```

---

### Feed Module Features Checklist

#### Core Features:
- [ ] Display feed items in reverse chronological order
- [ ] Real-time updates (new items appear automatically)
- [ ] Mark as read/unread
- [ ] Filter by type, channel, status
- [ ] Search feed content
- [ ] Create new feed item (admin/manager only)
- [ ] Delete feed item (creator or admin only)
- [ ] Notification badges (unread count)

#### Advanced Features (Optional):
- [ ] @mention users in messages
- [ ] React to feed items (👍, ❤️, 👏)
- [ ] Thread replies/comments
- [ ] Pin important messages
- [ ] Archive old messages
- [ ] Export feed history

---

## 👥 PEOPLE MODULE - Implementation Plan

### Overview
Complete team management system with profiles, certifications, and documents.

### Components to Build (Priority Order):

#### 1. PeopleList Component
**File:** `src/components/people/PeopleList.tsx`

**Features:**
- Grid/list view toggle
- Display all users in organization
- User avatar, name, role badge, department
- Status indicator (active/inactive)
- Quick actions (view profile, edit, assign task)
- Search and filter
- Sort by name, role, department, last active

---

#### 2. UserCard Component
**File:** `src/components/people/UserCard.tsx`

**Features:**
- User photo/avatar
- Display name and role badge
- Department and location
- Contact info (email, phone)
- Quick stats (tasks assigned, completed, compliance%)
- Action buttons (View Profile, Assign Task, Edit)
- Status badge (Active, On Leave, Inactive)

**Role Badge Colors:**
- 🔴 **Admin** - Red
- 🟣 **Owner** - Purple
- 🟡 **Manager** - Yellow
- 🟠 **Leader Chef** - Orange
- 🔵 **Cook** - Blue
- 🟢 **Barista** - Green
- ⚪ **Staff** - Gray

---

#### 3. UserProfile Component
**File:** `src/components/people/UserProfile.tsx`

**Features:**
- Full user details
- Profile photo upload
- Personal info (name, email, phone, PIN)
- Role and department assignment
- Documents section (certificates, IDs)
- Task history and statistics
- Compliance status
- Activity timeline
- Edit profile button (only for user or admin)

**Sections:**
1. **Personal Info** - Name, contact, PIN
2. **Role & Access** - Role badge, department, permissions
3. **Documents** - List of uploaded documents with expiration tracking
4. **Statistics** - Tasks completed, compliance rate, activity graph
5. **Activity** - Recent actions and tasks

---

#### 4. DocumentManager Component
**File:** `src/components/people/DocumentManager.tsx`

**Features:**
- Upload documents (certificates, IDs, training records)
- Document type selection (food handler cert, ID, medical, training)
- Expiration date tracking
- Document status (valid, expiring soon, expired)
- Download/view document
- Delete document (admin only)
- Reminder system for expiring documents
- Document verification (admin approval)

**Document Types:**
- 🏆 Food Handler Certificate
- 🪪 Government ID
- 💉 Medical Clearance
- 📄 Training Certificate
- 📋 Background Check
- 📝 Other

**Status Colors:**
- 🟢 Valid (> 30 days until expiry)
- 🟡 Expiring Soon (< 30 days)
- 🔴 Expired

---

#### 5. RoleManager Component
**File:** `src/components/people/RoleManager.tsx`

**Features:**
- Assign/change user role
- Permission preview for each role
- Role history log
- Bulk role assignment
- Role-based access control (RBAC) overview

**Admin Only**

---

#### 6. PeopleFilters Component
**File:** `src/components/people/PeopleFilters.tsx`

**Features:**
- Filter by role (Admin, Manager, Leader Chef, Cook, Barista)
- Filter by department
- Filter by status (Active, Inactive, On Leave)
- Filter by compliance (Compliant, Expiring Soon, Non-Compliant)
- Search by name or email
- Sort options (Name A-Z, Role, Last Active, Compliance)

---

#### 7. PeopleStats Component
**File:** `src/components/people/PeopleStats.tsx`

**Features:**
- Total team members
- By role breakdown (pie chart)
- By department breakdown
- Compliance rate
- Expiring documents count
- Active vs inactive users
- Recent additions

---

### Main People Page Structure

**File:** `src/pages/PeopleModule.tsx` (replace current placeholder)

**Layout:**
```
┌─────────────────────────────────────────┐
│  People                                 │
│  Manage your team                       │
├─────────────────────────────────────────┤
│  [+ Add User] [Filter ▼] [🔍 Search]   │
├─────────────────────────────────────────┤
│  📊 Stats: 24 Total | 3 Docs Expiring   │
├─────────────────────────────────────────┤
│  [All] [Admin] [Chef] [Cook] [Barista] │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 👤 John Doe  │  │ 👤 Jane Smith│    │
│  │ 🟠 Leader Chef│  │ 🔵 Cook      │    │
│  │ Kitchen Dept │  │ Kitchen Dept │    │
│  │ ✅ Compliant │  │ ⚠️ Cert Exp. │    │
│  │ [View] [Edit]│  │ [View] [Edit]│    │
│  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 👤 Mike Ross │  │ 👤 Sarah Lee │    │
│  │ 🟢 Barista   │  │ 🔴 Admin     │    │
│  │ Bar Dept     │  │ Management   │    │
│  │ ✅ Compliant │  │ ✅ Compliant │    │
│  │ [View] [Edit]│  │ [View] [Edit]│    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

---

### People Module Features Checklist

#### Core Features:
- [ ] View all team members (grid/list)
- [ ] View individual user profile
- [ ] Edit user profile (self or admin)
- [ ] Assign/change user role (admin only)
- [ ] Upload documents
- [ ] Track document expiration
- [ ] Filter and search users
- [ ] View user statistics
- [ ] Compliance dashboard

#### Advanced Features (Optional):
- [ ] Bulk user import (CSV)
- [ ] Send invitation emails
- [ ] Schedule shifts
- [ ] Time tracking integration
- [ ] Performance reviews
- [ ] Training module assignments
- [ ] Emergency contact info

---

## 🔗 Integration Points

### Feed ↔ People:
- Clicking on user in feed → Opens user profile
- User profile → Shows their feed activity
- Document expiration → Creates feed alert

### Feed ↔ Routine Tasks:
- Task created → Feed notification
- Task completed → Feed update
- Task overdue → Feed alert

### People ↔ Routine Tasks:
- Assign task → Select from people list
- User profile → Shows assigned/completed tasks
- Task delegation based on role/department

---

## 📅 Implementation Timeline

### Week 1: Feed Module Foundation
**Days 1-2:**
- [ ] Build FeedList component
- [ ] Build FeedCard component
- [ ] Connect to useFeed hook

**Days 3-4:**
- [ ] Build FeedFilters component
- [ ] Implement real-time subscriptions
- [ ] Add search functionality

**Day 5:**
- [ ] Build CreateFeedItem component (admin only)
- [ ] Add FeedStats component
- [ ] Testing and polish

---

### Week 2: People Module Foundation
**Days 1-2:**
- [ ] Build PeopleList component
- [ ] Build UserCard component
- [ ] Connect to usePeople hook

**Days 3-4:**
- [ ] Build UserProfile component
- [ ] Build DocumentManager component
- [ ] Document upload to Supabase Storage

**Day 5:**
- [ ] Build PeopleFilters component
- [ ] Build PeopleStats component
- [ ] Testing and polish

---

### Week 3: Integration & Polish
**Days 1-2:**
- [ ] Build RoleManager component
- [ ] Cross-module integration (Feed ↔ People ↔ Tasks)
- [ ] Notification system

**Days 3-4:**
- [ ] Permission system refinement
- [ ] Mobile responsiveness
- [ ] Performance optimization

**Day 5:**
- [ ] User acceptance testing
- [ ] Documentation updates
- [ ] Bug fixes

---

## 🎯 Success Criteria

### Feed Module:
✅ Users can view real-time feed updates  
✅ Admins can create and manage feed items  
✅ Filters and search work correctly  
✅ Mark as read/unread functionality  
✅ Mobile responsive design  

### People Module:
✅ Users can view team directory  
✅ Users can view their own profile  
✅ Admins can edit user roles and profiles  
✅ Document upload and tracking works  
✅ Compliance alerts for expiring documents  
✅ Mobile responsive design  

---

## 🚀 Getting Started

### Next Actions:
1. **Review this plan** - Confirm priorities and features
2. **Start with Feed Module** - Begin with FeedList and FeedCard
3. **Use existing hooks** - useFeed and usePeople already provide all data
4. **Follow Routine Tasks pattern** - Use same component structure as TasksOverview
5. **Mobile-first design** - Ensure responsive on all devices

### Questions to Answer:
- Should Feed support @mentions and reactions? (Phase 3 or Phase 4?)
- Should People have shift scheduling? (Phase 3 or separate iteration?)
- Do we need 1-to-1 chat in Feed? (Phase 4 likely)
- Should documents be public or role-restricted?

---

## 📦 Component Dependencies

All components will use existing shadcn/ui components:
- Card, CardHeader, CardTitle, CardContent
- Badge
- Button
- Dialog
- Tabs
- Avatar
- Separator
- DropdownMenu
- Input
- Textarea
- Select

Plus date-fns for date formatting and Supabase client for data/storage.

---

**Ready to start building!** 🎉
