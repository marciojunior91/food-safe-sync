# Iteration 13 - Integrated Modules Implementation Plan

**Date:** December 27, 2025  
**Modules:** Routine Tasks (formerly Daily Routines), Feed (formerly Notifications), People  
**Status:** Planning Phase

---

## Overview

This iteration focuses on improving and integrating three core modules that work together to manage daily operations, team communication, and staff management in food service establishments.

---

## Module 1: Routine Tasks (formerly Daily Routines)

### 🎯 Core Requirements

#### Module Rename
- Change "Daily Routines" → "Routine Tasks"
- Update all references in navigation, routes, and UI

#### Task Timeline System
- Create daily timeline objects with multiple tasks
- Support different task types/natures
- Visual timeline representation
- Task scheduling and assignment

#### Task Types (Natures)
**Required Types:**
1. **Cleaning Daily** - Daily cleaning tasks
2. **Cleaning Weekly** - Weekly deep cleaning tasks
3. **Temperature Logging** - Temperature checks for food safety
4. **Opening Checklist** - Morning opening procedures
5. **Closing Checklist** - Evening closing procedures
6. **Maintenance** - Equipment and facility maintenance
7. **Others** - Flexible category for custom tasks

#### Default Templates
1. **Opening Checklist Template**
   - Pre-configured opening procedures
   - Equipment checks
   - Safety inspections
   - Setup tasks

2. **Closing Checklist Template**
   - End-of-day procedures
   - Cleaning tasks
   - Equipment shutdown
   - Security checks

3. **Cleaning Checklist Template**
   - Daily cleaning tasks
   - Weekly cleaning tasks
   - Deep cleaning procedures
   - Sanitization protocols

#### Custom Template Creation
- Allow users to create custom templates
- Template name and description
- Pre-defined task list
- Assignable to specific roles
- Reusable across dates

#### Task Properties
Each task must include:
- ✅ **Completion Checkbox** - Mark task as complete
- 👤 **Responsible Person** - Assigned team member
- 📝 **Notes Field** - Observations and comments
- 📷 **Image Attachments** - Photo evidence (multiple images)
- ⏰ **Scheduled Time** - When task should be completed
- 🏷️ **Task Type** - Nature/category of task
- 🔄 **Recurrence** - Daily, weekly, custom pattern

### ✨ Additional Improvements (Suggestions)

1. **Task Scheduling & Recurrence**
   - Daily, weekly, monthly patterns
   - Custom recurrence rules
   - Auto-generation of recurring tasks
   - Holiday/exception handling

2. **Priority Levels**
   - Critical (🔴 High Priority)
   - Important (🟡 Medium Priority)
   - Normal (🟢 Low Priority)
   - Visual indicators

3. **Task Status Tracking**
   - Not Started
   - In Progress
   - Completed
   - Overdue
   - Skipped (with reason)

4. **Audit Trail & History**
   - Who completed the task
   - When it was completed
   - What notes were added
   - Photo evidence timestamp
   - Edit history

5. **Signature/Approval System**
   - Digital signature for completion
   - Supervisor approval required for critical tasks
   - Approval workflow

6. **Time Tracking**
   - Estimated time vs actual time
   - Track efficiency
   - Performance metrics

7. **Photo Evidence Enhancement**
   - Timestamp on photos
   - Geolocation (if enabled)
   - Before/after photos
   - Automatic compression

8. **Compliance & Reporting**
   - Export completed checklists as PDF
   - Compliance reports
   - Analytics dashboard
   - Completion rate tracking

9. **Notifications & Reminders**
   - Push notifications for upcoming tasks
   - Overdue task alerts
   - Integration with Feed module

10. **Mobile Optimization**
    - Quick capture for photos
    - Voice notes
    - Offline mode support
    - Sync when online

---

## Module 2: Feed (formerly Notifications)

### 🎯 Core Requirements

#### Module Rename
- Change "Notifications" → "Feed"
- Update all references in navigation, routes, and UI

#### Feed Concept
Modern activity feed showing:
- Real-time updates
- Chronological timeline
- Filterable by type
- Groupable by channel

#### Notification Types
1. **Task Delegated** 🎯
   - New task assigned to user
   - Task reassigned
   - Task deadline approaching

2. **Pending Documentation** ⚠️
   - Missing documents alert
   - Expired certificates
   - Incomplete profile

3. **Custom Note** 📝
   - Manager announcements
   - General notes
   - Important messages

4. **Maintenance** 🔧
   - Equipment maintenance needed
   - Facility issues
   - Repair requests

#### Groups/Channels
**Phase 1 (Current):**
- 🌐 **GENERAL** - All staff announcements
- ☕ **BARISTAS** - Coffee bar team
- 👨‍🍳 **COOKS** - Kitchen team

**Phase 2 (Future):**
- 🔧 **MAINTENANCE** - Maintenance staff
- Custom channels per establishment

#### Future: 1-to-1 Chat
**Structure for future implementation:**
- Private messaging between users
- Message threads
- Read receipts
- Typing indicators
- File sharing
- Message search

### ✨ Additional Improvements (Suggestions)

1. **Notification Preferences**
   - Per-channel settings
   - Quiet hours
   - Notification methods (push, email, SMS)
   - Frequency settings

2. **Rich Media Support**
   - Images
   - Videos
   - PDF documents
   - Voice messages

3. **Reactions & Acknowledgments**
   - Quick reactions (👍, ❤️, etc.)
   - "Seen by" indicators
   - Acknowledgment required for critical messages

4. **Search & Filtering**
   - Search messages
   - Filter by type, channel, date
   - Bookmarks/favorites

5. **Threading**
   - Reply to specific messages
   - Threaded conversations
   - Keep discussions organized

6. **Mentions & Tags**
   - @mention users
   - #hashtags for topics
   - Group mentions (@baristas)

7. **Message Scheduling**
   - Schedule messages for later
   - Recurring announcements
   - Time-sensitive posts

8. **Analytics**
   - Message read rates
   - Engagement metrics
   - Popular channels

---

## Module 3: People

### 🎯 Core Requirements

#### User Roles & Hierarchy
**Common Users (per establishment):**
- 👨‍🍳 **Cooks**
- ☕ **Baristas**
- Basic access rights

**Administrative Users (per establishment):**
- 👨‍🍳👑 **Leader Chefs** - Kitchen management
- 👔 **Owners** - Business owners
- 🛡️ **Admins** - System administrators

#### 4-Digit PIN System
- Each user has a 4-digit PIN
- Required for common users to edit their own profile
- Security layer for profile changes
- PIN reset by administrators

#### Permission Matrix

| Action | Common User | Leader Chef | Owner | Admin |
|--------|------------|-------------|-------|-------|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ (with PIN) | ✅ | ✅ | ✅ |
| View other profiles | Limited | ✅ | ✅ | ✅ |
| Add new user | ❌ | ✅ | ✅ | ✅ |
| Edit other users | ❌ | ✅ | ✅ | ✅ |
| Delete users | ❌ | ✅ | ✅ | ✅ |
| Reset PIN | ❌ | ✅ | ✅ | ✅ |
| View documents | Own only | ✅ | ✅ | ✅ |

#### User Profile Fields

**Personal Information:**
- 👤 **Full Name** (required)
- 📅 **Date of Birth** (required)
- 💼 **Position/Role** (required, dropdown)
- 📧 **Email** (required, unique)
- 📱 **Phone Number** (required)
- 🏠 **Address** (optional)
  - Street
  - City
  - State/Province
  - Postal Code
  - Country

**Employment Information:**
- 📅 **Admission Date** (required)
- 🆔 **TFN/Work Card Number** (required)
- 📄 **Employment Status** (Active, On Leave, Terminated)

**Certificates & Documents:**
- 📜 **Certificates** (multiple, .pdf attachments)
  - Certificate name
  - Issue date
  - Expiration date
  - Issuing organization
  - File attachment
- 📁 **Document Status** (Complete/Incomplete)

**System Fields:**
- 🔐 **User ID** (system generated)
- 🔑 **4-Digit PIN** (encrypted)
- 🏢 **Organization ID** (system assigned)
- 👥 **Role** (system assigned)
- 📊 **Profile Completion** (percentage)

### ✨ Additional Improvements (Suggestions)

1. **Document Expiration Tracking**
   - Auto-alert before certificate expiration
   - Grace period warnings
   - Renewal reminders
   - Compliance dashboard

2. **Profile Completion Wizard**
   - Step-by-step onboarding
   - Progress indicator
   - Required vs optional fields
   - Guided certificate upload

3. **Emergency Contacts**
   - Primary contact
   - Secondary contact
   - Medical information
   - Allergies/special needs

4. **Work Schedule**
   - Shifts assigned
   - Availability
   - Time-off requests
   - Integration with scheduling module

5. **Performance Tracking**
   - Task completion rate
   - Certifications earned
   - Training completed
   - Performance reviews

6. **Photo ID/Badge**
   - Profile photo
   - Badge generation
   - QR code for check-in
   - Printable badge

7. **Multi-language Support**
   - Language preference
   - Translated UI
   - Document translation

8. **Accessibility**
   - Text size preferences
   - High contrast mode
   - Screen reader support

---

## Integration: Feed ↔ People

### 🔗 Core Requirements

#### Incomplete Registration Warnings
- **In Feed Module:**
  - Warning banner for users with incomplete profiles
  - List of missing documents
  - Quick link to profile edit

#### Notification Types

**For Common Users (Pending Documentation):**
```
⚠️ Action Required: Complete Your Profile
Missing: Food Handler Certificate, TFN Number
Click here to update your profile
```

**For Admins/Leaders (Registration Complete):**
```
✅ Profile Completed: John Smith
John has completed all required documentation.
Review profile →
```

### ✨ Additional Integration Improvements

1. **Smart Notifications**
   - Context-aware reminders
   - Escalation to supervisors
   - Deadline tracking
   - Auto-follow-ups

2. **Compliance Dashboard**
   - Team compliance overview
   - Document expiration calendar
   - At-risk employees
   - Bulk actions

3. **Onboarding Workflow**
   - New hire checklist
   - Document collection
   - Training assignments
   - Welcome messages

4. **Audit Trail**
   - Document upload history
   - Profile changes log
   - Admin actions log
   - Compliance reports

---

## Database Schema Updates

### New Tables

#### 1. `routine_tasks`
```sql
CREATE TABLE routine_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  template_id UUID REFERENCES task_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- cleaning_daily, cleaning_weekly, temperature, opening, closing, maintenance, others
  priority TEXT DEFAULT 'normal', -- critical, important, normal
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, overdue, skipped
  assigned_to UUID REFERENCES profiles(user_id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES profiles(user_id),
  notes TEXT,
  skip_reason TEXT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(user_id),
  approved_at TIMESTAMP,
  recurrence_pattern JSONB, -- {frequency: 'daily', interval: 1, days: [1,2,3,4,5]}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `task_templates`
```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  tasks JSONB NOT NULL, -- Array of pre-defined tasks
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `task_attachments`
```sql
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES routine_tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(user_id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- {timestamp, geolocation, etc}
);
```

#### 4. `feed_items` (rename from notifications)
```sql
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  type TEXT NOT NULL, -- task_delegated, pending_docs, custom_note, maintenance
  channel TEXT NOT NULL, -- general, baristas, cooks, maintenance
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES profiles(user_id),
  target_user_id UUID REFERENCES profiles(user_id), -- null for channel-wide
  related_entity_type TEXT, -- task, profile, maintenance
  related_entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

#### 5. `feed_reads`
```sql
CREATE TABLE feed_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  UNIQUE(feed_item_id, user_id)
);
```

#### 6. `user_pins`
```sql
CREATE TABLE user_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
  pin_hash TEXT NOT NULL, -- bcrypt hashed 4-digit PIN
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. `user_documents`
```sql
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- certificate, id, work_card, etc
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  issue_date DATE,
  expiration_date DATE,
  issuing_organization TEXT,
  status TEXT DEFAULT 'active', -- active, expired, pending_renewal
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Updated Tables

#### Update `profiles` table
```sql
ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'cook', -- cook, barista, leader_chef, owner, admin
ADD COLUMN position TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN phone TEXT,
ADD COLUMN address JSONB,
ADD COLUMN admission_date DATE,
ADD COLUMN tfn_number TEXT,
ADD COLUMN employment_status TEXT DEFAULT 'active',
ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN last_pin_change TIMESTAMP;
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema updates
- [ ] Update profiles table with new fields
- [ ] Create new tables (routine_tasks, task_templates, feed_items, etc.)
- [ ] Rename modules (Daily Routines → Routine Tasks, Notifications → Feed)
- [ ] Update navigation and routes

### Phase 2: Routine Tasks Core (Week 3-4)
- [ ] Task types system
- [ ] Task creation and assignment
- [ ] Default templates implementation
- [ ] Custom template builder
- [ ] Task timeline UI
- [ ] Completion and notes functionality
- [ ] Image attachments

### Phase 3: People Module Enhancement (Week 5-6)
- [ ] Role-based permissions
- [ ] 4-digit PIN system
- [ ] Profile fields expansion
- [ ] Document upload system
- [ ] Certificate management
- [ ] Profile completion tracking

### Phase 4: Feed Module (Week 7-8)
- [ ] Feed UI redesign
- [ ] Notification types implementation
- [ ] Channel system
- [ ] Real-time updates
- [ ] Read/acknowledgment tracking

### Phase 5: Integration (Week 9-10)
- [ ] Feed ↔ People integration
- [ ] Task delegation notifications
- [ ] Document expiration alerts
- [ ] Compliance dashboard
- [ ] Testing and refinement

### Phase 6: Polish & Launch (Week 11-12)
- [ ] Mobile optimization
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Documentation
- [ ] Training materials
- [ ] Production deployment

---

## Technical Stack

### Frontend
- **Framework:** React + TypeScript
- **Routing:** React Router
- **State Management:** React Context + Hooks
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **Date/Time:** date-fns
- **File Upload:** react-dropzone
- **Image Handling:** Supabase Storage

### Backend
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime subscriptions
- **RLS:** Row Level Security policies

### Additional Libraries
- **PDF Generation:** jsPDF or react-pdf
- **QR Codes:** qrcode.react
- **Image Compression:** browser-image-compression
- **Encryption:** bcryptjs (for PIN hashing)

---

## Security Considerations

1. **PIN Security**
   - Hash PINs with bcrypt
   - Rate limiting on PIN attempts
   - Lockout after failed attempts
   - Admin override capability

2. **Document Security**
   - Encrypted storage
   - Access control via RLS
   - Audit logging
   - Secure file URLs with expiration

3. **Role-Based Access**
   - Strict RLS policies
   - Frontend route guards
   - API permission checks
   - Audit trail for sensitive actions

4. **Data Privacy**
   - GDPR compliance
   - Data retention policies
   - User consent for data collection
   - Right to be forgotten

---

## Success Metrics

### Routine Tasks
- ✅ Task completion rate > 90%
- ✅ Average task completion time
- ✅ Template usage rate
- ✅ Photo evidence attachment rate
- ✅ On-time completion rate

### Feed
- ✅ Message read rate > 95%
- ✅ Acknowledgment rate for critical messages
- ✅ Response time to notifications
- ✅ Channel engagement rates

### People
- ✅ Profile completion rate > 95%
- ✅ Document compliance rate > 100%
- ✅ Certificate expiration prevention
- ✅ Onboarding time reduction
- ✅ Administrative time savings

---

## Next Steps

1. **Review this plan with stakeholders**
2. **Prioritize features for MVP**
3. **Create detailed wireframes/mockups**
4. **Set up database migrations**
5. **Begin Phase 1 implementation**

---

**Document Version:** 1.0  
**Last Updated:** December 27, 2025  
**Next Review:** Start of Phase 1
