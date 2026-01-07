# Database Schema Review: Authentication and People Management

**Date:** January 4, 2026  
**Status:** ✅ REVIEWED AND DOCUMENTED

---

## Overview

The Tampa APP uses a **separated authentication and people management system** designed to support:

1. **Shared login accounts** for operational staff (cooks, baristas)
2. **Individual accounts** for leadership (admins, managers, leader chefs)
3. **PIN-based profile selection** for team members
4. **Complete profile tracking** with missing field alerts

---

## Table Relationships

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles (User authentication context)
    ↓ (1:many)
user_roles (Role assignments)
    ↓ (1:many) ← KEY RELATIONSHIP!
team_members (Actual staff/people)
    └─ auth_role_id → profiles.user_id

Example: cook@company.com (1 auth user)
    ↓
    profiles.user_id = abc-123
    ↓
    team_members:
      - John (id=1, auth_role_id=abc-123, PIN=1234)
      - Maria (id=2, auth_role_id=abc-123, PIN=5678)
      - Carlos (id=3, auth_role_id=abc-123, PIN=9012)
```

**Critical Concept:** One authenticated user account can have **MANY team members** linked via `auth_role_id`. This enables the shared login pattern where multiple people use the same credentials (e.g., cook@company.com) and then select their individual profile via PIN.

---

## 1. `profiles` Table

**Purpose:** Links Supabase auth users to the application context

### Schema
```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE REFERENCES auth.users(id) -- 1:1 with auth
display_name TEXT
organization_id UUID REFERENCES organizations
location_id UUID REFERENCES locations  -- DEPRECATED, removed in later migrations
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

-- NOTE: 'role' column was REMOVED - use user_roles table instead!
```

### Key Points
- **One profile per auth.users record** (automatically created on signup)
- Stores the **authentication context**: which organization, which location
- ⚠️ **IMPORTANT:** The `role` column was **REMOVED** in migration `20251016014922` - always use `user_roles` table for role checks
- This is the **authentication entity**, not the person entity

### RLS Policies
✅ Users can view/update their own profile
✅ Auto-created on user signup via trigger

---

## 2. `user_roles` Table

**Purpose:** Secure role assignment separated from profiles

### Schema
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id)
role app_role ('admin', 'manager', 'leader_chef', 'staff')
created_at TIMESTAMPTZ
created_by UUID REFERENCES auth.users(id)
UNIQUE (user_id, role) -- Users can have multiple roles
```

### Key Points
- **Separate table for security** - prevents role tampering
- Users can have **multiple roles** (e.g., both 'manager' and 'leader_chef')
- Helper functions: `has_role(user_id, role)`, `has_any_role(user_id, roles[])`
- Used for **authorization checks** throughout the application

### RLS Policies
✅ Users can view their own roles
✅ Only admins can assign roles

---

## 3. `team_members` Table

**Purpose:** Actual staff/people working at the establishment

### Schema
```sql
id UUID PRIMARY KEY

-- Personal Information
display_name TEXT NOT NULL
email TEXT (optional)
phone TEXT (optional)
position TEXT -- "Head Chef", "Pastry Cook", "Barista"

-- Employment
hire_date DATE
department_id UUID
role_type team_member_role ('cook', 'barista', 'manager', 'leader_chef', 'admin')
is_active BOOLEAN

-- Authentication Link
auth_role_id UUID REFERENCES profiles(user_id) -- Links to shared login
pin_hash TEXT -- 4-digit PIN for profile editing

-- Profile Completion
profile_complete BOOLEAN
required_fields_missing TEXT[]

-- Organization
organization_id UUID NOT NULL REFERENCES organizations
location_id UUID

-- Metadata
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
created_by UUID REFERENCES profiles(user_id)
updated_by UUID REFERENCES profiles(user_id)
```

### Key Points
- **Many team members can share one auth account** via `auth_role_id` ← **1:MANY relationship!**
- Each team member has a **4-digit PIN** for profile editing
- Tracks **profile completion** with `required_fields_missing` array
- The `role_type` is their **operational role**, not auth role
- Can be **inactive** without deleting the record

### Relationship Examples

**Shared Login (1:MANY):**
```
auth.users (cook@company.com, user_id = abc-123)
    → profiles (user_id = abc-123, organization_id = org-1)
        → team_members:
            • John Smith (auth_role_id = abc-123, pin_hash = hash1)
            • Maria Garcia (auth_role_id = abc-123, pin_hash = hash2)
            • Carlos Lopez (auth_role_id = abc-123, pin_hash = hash3)
```

**Individual Login (1:1 or 1:0):**
```
auth.users (john.chef@company.com, user_id = xyz-789)
    → profiles (user_id = xyz-789, organization_id = org-1)
        → user_roles (user_id = xyz-789, role = 'leader_chef')
        → team_members (optional):
            • John Chef (auth_role_id = xyz-789, for employment records)
```

### RLS Policies
✅ Users can view active team members in their org
✅ Admin/Manager/Leader Chef can create/update team members
✅ Team members cannot edit themselves (PIN-based editing via app logic)

---

## Authentication Flow

### Scenario 1: Operational Staff (Cooks, Baristas)

1. **Login**: User logs in with shared account (e.g., `cook@company.com`)
2. **Profile Context**: System loads `profiles` record → gets `organization_id`
3. **Team Member Selection**: App shows list of team members with `role_type = 'cook'`
4. **PIN Verification**: User enters 4-digit PIN to verify identity
5. **Session**: App stores selected `team_member.id` in session/context
6. **Operations**: All actions (labeling, tasks, etc.) record `team_member.id` as `prepared_by`

**Auth Flow (1:MANY Relationship):**
```
auth.users (cook@company.com, user_id = abc-123)
    ↓ (1:1)
    profiles (user_id = abc-123, organization_id = org-1)
    ↓ (1:MANY) ← One profile links to MANY team members!
    team_members:
      • John (id=1, auth_role_id=abc-123, PIN=1234)
      • Maria (id=2, auth_role_id=abc-123, PIN=5678)  
      • Carlos (id=3, auth_role_id=abc-123, PIN=9012)
```

**Database Query Example:**
```sql
-- Get all team members for the shared cook account
SELECT tm.* 
FROM team_members tm
WHERE tm.auth_role_id = 'abc-123'  -- profiles.user_id
  AND tm.is_active = true;

-- Returns: John, Maria, Carlos (3 records)
```

### Scenario 2: Leadership (Admin, Manager, Leader Chef)

1. **Login**: User logs in with personal account (e.g., `john.chef@company.com`)
2. **Profile Context**: System loads `profiles` record → gets `organization_id`
3. **Role Check**: Query `user_roles` to get actual permissions
4. **Direct Access**: No team member selection needed
5. **Operations**: All actions record `auth.uid()` as `created_by`

**Auth Flow (1:1 or 1:0 Relationship):**
```
auth.users (john.chef@company.com, user_id = xyz-789)
    ↓ (1:1)
    profiles (user_id = xyz-789, organization_id = org-1)
    ↓ (1:1) ← One profile, one user_role
    user_roles (user_id = xyz-789, role = 'leader_chef')
    ↓ (optional 1:1) ← May or may not have team_member record
    team_members (auth_role_id = xyz-789) -- for employment data only
```

---

## Data Integrity Checks

### ✅ Foreign Keys
- `profiles.user_id` → `auth.users.id` (CASCADE DELETE)
- `user_roles.user_id` → `auth.users.id` (CASCADE DELETE)
- `team_members.auth_role_id` → `profiles.user_id` (NULL allowed)
- `team_members.organization_id` → `organizations.id` (NOT NULL)

### ✅ Indexes
- `profiles.user_id` (UNIQUE)
- `user_roles.user_id, user_roles.role` (UNIQUE)
- `team_members.organization_id`, `team_members.role_type`, `team_members.auth_role_id`

### ✅ RLS Policies
All three tables have RLS enabled with appropriate policies

---

## Recommended Strategy for Auth Users

Based on the requirements, here's the recommended approach:

### Per Establishment Setup

#### Shared Accounts (Operational Staff)
```
cook@company.com       → All cooks share this
  └─ profiles (organization_id set)
  └─ user_roles: ['staff']  -- Use user_roles, NOT profiles.role!
  └─ team_members (John, Maria, Carlos) with role_type='cook' and individual PINs

barista@company.com    → All baristas share this
  └─ profiles (organization_id set)
  └─ user_roles: ['staff']  -- Use user_roles, NOT profiles.role!
  └─ team_members (Lisa, Tom) with role_type='barista' and individual PINs
```

#### Individual Accounts (Leadership)
```
john.chef@company.com
  └─ profiles (organization_id set)
  └─ user_roles: ['leader_chef']  -- Roles ONLY in user_roles table!
  └─ Optional: team_members record for employment data

sarah.manager@company.com
  └─ profiles (organization_id set)
  └─ user_roles: ['manager']  -- Roles ONLY in user_roles table!

admin@company.com
  └─ profiles (organization_id set)
  └─ user_roles: ['admin']  -- Roles ONLY in user_roles table!
```

---

## Missing/Required Enhancements

### 🔧 Task 8: Expand team_members Data Model

Currently missing from `team_members`:
- ❌ `date_of_birth DATE`
- ❌ `address TEXT`
- ❌ `tfn_number TEXT` (Tax File Number / Carteira de Trabalho)
- ❌ `certificates` - separate table

**Migration needed:**
```sql
ALTER TABLE team_members 
  ADD COLUMN date_of_birth DATE,
  ADD COLUMN address TEXT,
  ADD COLUMN tfn_number TEXT;

CREATE TABLE team_member_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  certificate_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  upload_date TIMESTAMPTZ DEFAULT now(),
  expiration_date DATE,
  issued_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending'))
);
```

### 🔧 Update Profile Completion Logic

Function to check `team_members.required_fields_missing`:
```sql
CREATE OR REPLACE FUNCTION check_team_member_completion()
RETURNS TRIGGER AS $$
DECLARE
  missing_fields TEXT[] := '{}';
BEGIN
  IF NEW.date_of_birth IS NULL THEN missing_fields := array_append(missing_fields, 'date_of_birth'); END IF;
  IF NEW.email IS NULL THEN missing_fields := array_append(missing_fields, 'email'); END IF;
  IF NEW.phone IS NULL THEN missing_fields := array_append(missing_fields, 'phone'); END IF;
  IF NEW.address IS NULL THEN missing_fields := array_append(missing_fields, 'address'); END IF;
  IF NEW.tfn_number IS NULL THEN missing_fields := array_append(missing_fields, 'tfn_number'); END IF;
  IF NEW.hire_date IS NULL THEN missing_fields := array_append(missing_fields, 'hire_date'); END IF;
  
  NEW.required_fields_missing := missing_fields;
  NEW.profile_complete := (array_length(missing_fields, 1) IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Conclusion

### ✅ Current State
- Tables are properly structured with correct relationships
- Foreign keys and indexes are in place
- RLS policies are functioning correctly
- Separation between auth (profiles/user_roles) and people (team_members) is correct
- **1:MANY relationship** between profiles and team_members is working as designed

### � Key Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| `auth.users` → `profiles` | **1:1** | One auth user = one profile (authentication context) |
| `profiles` → `user_roles` | **1:MANY** | One profile can have multiple roles |
| `profiles` → `team_members` | **1:MANY** | One profile (shared login) can link to many team members |
| `organizations` → `team_members` | **1:MANY** | One organization has many team members |

**Example Counts:**
```
cook@company.com (1 auth.users)
  → 1 profile
  → 1 user_role (staff)
  → 5 team_members (John, Maria, Carlos, Ana, Pedro)
```

### �🔧 Next Steps
1. **Expand team_members schema** (Task 8)
2. **Build AddTeamMemberDialog** (Task 9)
3. **Integrate feed notifications** for incomplete profiles (Tasks 12-14)
4. **Update UserSelectionDialog** to handle new fields (Task 7)

### ⚠️ Important Notes
- Never expose `pin_hash` to the frontend
- Always verify PINs server-side (use Supabase Edge Functions)
- ⚠️ **CRITICAL:** `profiles.role` column was **REMOVED** - always use `user_roles` table for role checks
- ⚠️ **CRITICAL:** One `profiles.user_id` can have **MANY** `team_members` via `auth_role_id` (1:MANY)
- Monitor `team_members.profile_complete` for feed notifications
