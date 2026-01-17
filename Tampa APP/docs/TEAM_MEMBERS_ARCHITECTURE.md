# 🏗️ TEAM MEMBERS ARCHITECTURE - Complete Redesign

## 📋 Overview

This document outlines the complete redesign of the People/Team management system, separating authentication from actual team member management.

## 🎯 Core Concept

### Current Problem
- `profiles` table mixed authentication data with team member information
- Each person had their own login credentials
- Difficult to manage large teams with many cooks/baristas

### New Solution
**Separation of Concerns:**
1. **Authentication Layer** (`profiles` + `user_roles`) - Shared login accounts
2. **Team Members Layer** (`team_members`) - Actual staff information

## 🔐 Authentication Architecture

### Shared Login Accounts

Each organization will have **shared authentication accounts** by role:

```
cook@restaurant.com       → Used by ALL cooks
barista@restaurant.com    → Used by ALL baristas  
manager@restaurant.com    → Used by ALL managers
leader_chef@restaurant.com → Used by ALL leader chefs
admin@restaurant.com      → Used by admins
```

### Login Flow

```
1. User enters shared credentials (e.g., cook@restaurant.com)
   ↓
2. System authenticates against profiles/user_roles
   ↓
3. User sees list of team members linked to that role
   ↓
4. User selects their personal profile (e.g., "João Silva")
   ↓
5. System stores selected team_member_id in session
   ↓
6. User can view their profile and see their information
```

### Editing Personal Profile

```
1. Team member clicks "Edit Profile"
   ↓
2. System prompts for 4-digit PIN
   ↓
3. PIN is verified against team_members.pin_hash
   ↓
4. If valid, profile editing is unlocked for that session
```

## 📊 Database Structure

### Existing Tables (Authentication Only)

**profiles**
```sql
- user_id (UUID, PK)
- organization_id (UUID)
- display_name (TEXT) -- e.g., "Cook Account"
- email (TEXT) -- e.g., cook@restaurant.com
- created_at, updated_at
```

**user_roles**
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- role (app_role) -- admin, manager, leader_chef, staff
```

### New Table (Team Members)

**team_members**
```sql
- id (UUID, PK)
- display_name (TEXT) -- e.g., "João Silva"
- email (TEXT) -- Personal email (optional)
- phone (TEXT)
- position (TEXT) -- e.g., "Pastry Cook"
- hire_date (DATE)
- department_id (UUID)
- role_type (team_member_role) -- cook, barista, manager, leader_chef, admin
- is_active (BOOLEAN)
- auth_role_id (UUID, FK → profiles) -- Links to shared login
- pin_hash (TEXT) -- Hashed 4-digit PIN
- profile_complete (BOOLEAN)
- required_fields_missing (TEXT[])
- organization_id (UUID)
- location_id (UUID)
- created_at, updated_at
```

## 🔄 Data Flow

### 1. Organization Setup

When a new organization is created:

```sql
-- Create shared auth accounts
INSERT INTO profiles (user_id, organization_id, display_name, email)
VALUES 
  (gen_random_uuid(), org_id, 'Cook Account', 'cook@org.com'),
  (gen_random_uuid(), org_id, 'Barista Account', 'barista@org.com'),
  (gen_random_uuid(), org_id, 'Manager Account', 'manager@org.com'),
  (gen_random_uuid(), org_id, 'Leader Chef Account', 'leader_chef@org.com'),
  (gen_random_uuid(), org_id, 'Admin Account', 'admin@org.com');

-- Assign roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'staff' FROM profiles WHERE email LIKE 'cook@org.com'
UNION
SELECT user_id, 'staff' FROM profiles WHERE email LIKE 'barista@org.com'
UNION
SELECT user_id, 'manager' FROM profiles WHERE email LIKE 'manager@org.com'
UNION
SELECT user_id, 'leader_chef' FROM profiles WHERE email LIKE 'leader_chef@org.com'
UNION
SELECT user_id, 'admin' FROM profiles WHERE email LIKE 'admin@org.com';
```

### 2. Creating Team Members

Admin/Manager/Leader Chef creates a new cook:

```typescript
// 1. Get auth_role_id for cook account
const { data: cookAuth } = await supabase
  .from('profiles')
  .select('user_id')
  .eq('email', 'cook@restaurant.com')
  .single();

// 2. Generate random PIN
const randomPIN = generateRandomPIN(); // e.g., "1234"
const pinHash = hashPIN(randomPIN);

// 3. Create team member
const { data: teamMember } = await supabase
  .from('team_members')
  .insert({
    display_name: 'João Silva',
    email: 'joao@personal.com',
    phone: '5511999999999',
    position: 'Line Cook',
    role_type: 'cook',
    auth_role_id: cookAuth.user_id,
    pin_hash: pinHash,
    organization_id: org_id
  });

// 4. Send PIN to team member (via SMS, email, or printed)
sendPINToTeamMember(teamMember.id, randomPIN);
```

### 3. Team Member Selects Profile

After logging in with shared credentials:

```typescript
// Get all team members linked to this auth account
const { data: linkedMembers } = await supabase
  .from('team_members')
  .select('*')
  .eq('auth_role_id', currentAuthUser.id)
  .eq('is_active', true);

// Show selection screen
<TeamMemberSelector 
  members={linkedMembers}
  onSelect={(memberId) => {
    setCurrentTeamMember(memberId);
    navigate('/dashboard');
  }}
/>
```

### 4. Editing Profile with PIN

```typescript
// User clicks "Edit Profile"
<PINInput
  open={pinDialogOpen}
  teamMemberName={teamMember.display_name}
  onSubmit={async (pin) => {
    // Verify PIN
    const { data } = await supabase.rpc('verify_team_member_pin', {
      member_id: teamMember.id,
      pin_input: pin
    });
    
    return data.is_valid;
  }}
/>
```

## 🔔 Profile Completion Notifications

### Trigger on Team Member Creation

```sql
-- Automatically creates feed notification if profile incomplete
CREATE TRIGGER notify_incomplete_profile
  AFTER INSERT ON team_members
  FOR EACH ROW
  WHEN (NEW.profile_complete = false)
  EXECUTE FUNCTION notify_incomplete_team_member_profile();
```

### Notification Example

```
Feed Item:
  Type: team_member_incomplete
  Title: "Complete Your Profile"
  Content: "Welcome João Silva! Please complete your profile by filling in: email, phone"
  Priority: medium
  Target: Specific team member
```

## 🔒 Permissions Matrix

| Action | Cook/Barista (Self) | Manager | Leader Chef | Admin |
|--------|---------------------|---------|-------------|-------|
| **View own profile** | ✅ (after login) | ✅ | ✅ | ✅ |
| **View other profiles** | ✅ (read-only) | ✅ | ✅ | ✅ |
| **Edit own profile** | ✅ (with PIN) | ✅ (with PIN) | ✅ (with PIN) | ✅ (with PIN) |
| **Edit other profiles** | ❌ | ✅ | ✅ | ✅ |
| **Create team members** | ❌ | ✅ | ✅ | ✅ |
| **Deactivate team members** | ❌ | ✅ | ✅ | ✅ |
| **Change role_type** | ❌ | ❌ | ✅ | ✅ |
| **Reset PIN** | ❌ | ✅ | ✅ | ✅ |

## 📱 UI Components

### 1. TeamMemberSelector (Post-Login)
Shows all team members linked to the logged-in auth account

### 2. PINInput  
4-digit PIN entry dialog for profile editing

### 3. TeamMembersList
Replaces current PeopleList, shows team_members instead of profiles

### 4. TeamMemberProfile
Replaces current UserProfile, shows team member details

### 5. EditTeamMemberDialog
Form to edit team member information (requires PIN for self-edit)

### 6. CreateTeamMemberDialog
Admin/Manager/Leader Chef can create new team members

## 🚀 Implementation Steps

### Phase 1: Database Setup ✅
- [x] Create team_members table migration
- [x] Add profile completion triggers
- [x] Add feed notification trigger
- [x] Set up RLS policies

### Phase 2: Core Utilities ✅
- [x] PIN hashing/verification utilities
- [x] PINInput component
- [x] team_members types

### Phase 3: Backend Integration (TODO)
- [ ] Create useTeamMembers hook
- [ ] Implement CRUD operations
- [ ] Add PIN verification RPC function
- [ ] Profile completion checking

### Phase 4: UI Components (TODO)
- [ ] TeamMemberSelector screen
- [ ] Refactor PeopleModule to use team_members
- [ ] Update all team member components
- [ ] Add PIN requirement to edit dialogs

### Phase 5: Auth Flow (TODO)
- [ ] Implement team member selection after login
- [ ] Store selected_team_member_id in session
- [ ] Update navigation/permissions based on team member
- [ ] Add "Switch Profile" functionality

### Phase 6: Migration (TODO)
- [ ] Create migration script for existing data
- [ ] Create shared auth accounts per organization
- [ ] Migrate profiles → team_members
- [ ] Generate random PINs for existing members
- [ ] Send PINs to team members

### Phase 7: Feed Integration (TODO)
- [ ] Test profile completion notifications
- [ ] Add "Complete Profile" action in feed items
- [ ] Show incomplete profile reminders

## 🧪 Testing Checklist

### Authentication
- [ ] Login with cook@restaurant.com shows all cooks
- [ ] Login with barista@restaurant.com shows all baristas
- [ ] Each team member can select their profile
- [ ] Selected profile persists across navigation

### PIN System
- [ ] PIN is required to edit own profile
- [ ] Correct PIN allows editing
- [ ] Incorrect PIN shows error and clears input
- [ ] Admin can edit without PIN (for others)

### Profile Completion
- [ ] New team member without email/phone marked incomplete
- [ ] Feed notification created for incomplete profiles
- [ ] Completing fields marks profile as complete
- [ ] required_fields_missing array updates correctly

### Permissions
- [ ] Cooks can view but not edit other profiles
- [ ] Managers can create/edit/deactivate team members
- [ ] Leader chefs can change role types
- [ ] Admins have full access

## 📝 Notes

### Security Considerations
- PINs are hashed with salt using SHA-256
- Timing-safe comparison prevents timing attacks
- RLS policies restrict access by organization
- Soft deletes (is_active = false) instead of hard deletes

### User Experience
- Clear feedback on PIN entry
- Auto-focus and auto-submit for smoother PIN entry
- Paste support for PIN entry
- Clear error messages

### Scalability
- Indexes on frequently queried fields
- Efficient team member lookup by auth_role_id
- Profile completion check uses triggers (no polling)

## 🔄 Migration Path

### For Existing Organizations

```sql
-- 1. Create shared auth accounts
-- 2. Migrate existing profiles to team_members
-- 3. Link team_members to appropriate auth accounts
-- 4. Generate and send PINs
-- 5. Update application to use new system
-- 6. Keep old profiles table for reference (read-only)
```

Detailed migration script in: `scripts/migrate_to_team_members.sql`

## 📚 References

- Migration: `supabase/migrations/20260103000000_create_team_members_table.sql`
- PIN Utils: `src/utils/pinUtils.ts`
- PINInput: `src/components/people/PINInput.tsx`
- Types: `src/types/teamMembers.ts`
