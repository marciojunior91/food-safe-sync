# 🏗️ Clean Architecture - Authentication Tables

**Data:** 2026-01-04  
**Status:** 🟢 Organizado e Otimizado

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYERS                     │
└─────────────────────────────────────────────────────────────┘

Layer 1: Authentication Identity
┌──────────────────┐
│   auth.users     │  ← Supabase Auth (email/password)
│  - id (UUID)     │
│  - email         │
│  - encrypted_pw  │
└────────┬─────────┘
         │
         │ 1:1
         ↓
┌──────────────────┐
│    profiles      │  ← Organization Link (CLEAN)
│  - user_id (FK)  │
│  - org_id (FK)   │  ✅ NOT NULL, CASCADE
│  - display_name  │
└────────┬─────────┘
         │
         ├─────────────────────┬────────────────────┐
         │ 1:N                 │ 1:N                │
         ↓                     ↓                    ↓
┌─────────────────┐   ┌────────────────┐   ┌──────────────────┐
│   user_roles    │   │ team_members   │   │  organizations   │
│  - user_id (FK) │   │ - user_id (FK) │   │  - id            │
│  - role (ENUM)  │   │ - pin_hash     │   │  - name          │
│                 │   │ - role_type    │   │  - slug          │
│  System Perms   │   │ - position     │   └──────────────────┘
└─────────────────┘   │                │
                      │  Operational   │
                      │  Identity      │
                      └────────────────┘

Layer 2: System Authorization (user_roles)
  → admin, manager, leader_chef, staff
  → Controls what you can ACCESS in the system

Layer 3: Operational Identity (team_members)
  → cook, barista, manager, leader_chef, admin
  → Controls who you ARE in daily operations
```

---

## 📋 Table: `profiles`

### Purpose
Links `auth.users` to `organizations`. One profile per authenticated user.

### Columns (CLEAN - No Deprecated Fields)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | NO | - | FK to auth.users (UNIQUE) |
| `organization_id` | UUID | NO | - | FK to organizations (CASCADE) |
| `display_name` | TEXT | YES | NULL | Display name for UI |
| `created_at` | TIMESTAMPTZ | NO | now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | now() | Last update timestamp |

### What Was Removed ❌

- ❌ **`role`** - Deprecated! Use `user_roles` table instead
- ❌ **`location_id`** - Belongs to `team_members`, not auth profiles

### Foreign Keys

```sql
profiles.user_id → auth.users(id) ON DELETE CASCADE
profiles.organization_id → organizations(id) ON DELETE CASCADE
```

### Indexes

```sql
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE UNIQUE INDEX profiles_user_id_key ON profiles(user_id);
```

### RLS Policies

```sql
-- Users can view their own profile
SELECT: auth.uid() = user_id

-- Users can update their own profile
UPDATE: auth.uid() = user_id

-- Users can insert their own profile (on signup)
INSERT: auth.uid() = user_id
```

---

## 📋 Table: `user_roles`

### Purpose
Stores system roles for authorization. A user can have MULTIPLE roles.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | NO | - | FK to auth.users |
| `role` | app_role | NO | - | ENUM: admin, manager, leader_chef, staff |
| `created_at` | TIMESTAMPTZ | NO | now() | Creation timestamp |
| `created_by` | UUID | YES | NULL | FK to auth.users (who assigned role) |

### ENUM: `app_role`

```sql
CREATE TYPE app_role AS ENUM (
  'admin',        -- Full system access
  'manager',      -- Department management
  'leader_chef',  -- Kitchen leadership
  'staff'         -- Basic access
);
```

### Foreign Keys

```sql
user_roles.user_id → auth.users(id) ON DELETE CASCADE
user_roles.created_by → auth.users(id) ON DELETE SET NULL
```

### Constraints

```sql
-- A user can have each role only once
UNIQUE (user_id, role)
```

### Indexes

```sql
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

### Helper Functions

```sql
-- Check if user has a specific role
has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN

-- Check if user has any role in array
has_any_role(_user_id UUID, _roles app_role[]) RETURNS BOOLEAN

-- Example usage in RLS:
USING (has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[]))
```

---

## 📋 Table: `team_members`

### Purpose
Operational identity for daily work. Separates "who you are in the kitchen" from "what you can access in the system".

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `display_name` | TEXT | NO | Full name |
| `email` | TEXT | YES | Contact email |
| `phone` | TEXT | YES | Contact phone |
| `position` | TEXT | YES | Job title (e.g., "Sous Chef") |
| `hire_date` | DATE | YES | Employment start date |
| `role_type` | team_member_role | NO | ENUM: cook, barista, manager, leader_chef, admin |
| `organization_id` | UUID | NO | FK to organizations |
| `auth_role_id` | UUID | YES | FK to profiles.user_id (links to auth account) |
| `pin_hash` | TEXT | YES | SHA-256 hashed 4-digit PIN |
| `is_active` | BOOLEAN | NO | Active status (soft delete) |
| `profile_complete` | BOOLEAN | NO | Profile completion flag |
| `required_fields_missing` | TEXT[] | YES | Array of missing field names |
| `created_at` | TIMESTAMPTZ | NO | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | Last update timestamp |

### ENUM: `team_member_role`

```sql
CREATE TYPE team_member_role AS ENUM (
  'cook',
  'barista',
  'manager',
  'leader_chef',
  'admin'
);
```

**Note:** `team_member_role` is different from `app_role`!
- `app_role` → System permissions (what you can ACCESS)
- `team_member_role` → Operational role (who you ARE)

---

## 🔄 Relationship Examples

### Example 1: Shared Cook Account

```sql
-- Supabase Auth User
auth.users.email = 'cook@restaurant.com'
auth.users.id = '550e8400-e29b-41d4-a716-446655440000'

-- Profile (auth link to org)
profiles.user_id = '550e8400-e29b-41d4-a716-446655440000'
profiles.organization_id = 'org-123'
profiles.display_name = 'Cook Account'

-- User Role (system permissions)
user_roles.user_id = '550e8400-e29b-41d4-a716-446655440000'
user_roles.role = 'staff'  -- Can access basic features

-- Team Members (3 cooks share this login)
team_members[0].auth_role_id = '550e8400-e29b-41d4-a716-446655440000'
team_members[0].display_name = 'Ana Costa'
team_members[0].role_type = 'cook'
team_members[0].pin_hash = 'hash_of_1111'

team_members[1].auth_role_id = '550e8400-e29b-41d4-a716-446655440000'
team_members[1].display_name = 'Pedro Almeida'
team_members[1].role_type = 'cook'
team_members[1].pin_hash = 'hash_of_2222'

team_members[2].auth_role_id = '550e8400-e29b-41d4-a716-446655440000'
team_members[2].display_name = 'Lucia Fernandes'
team_members[2].role_type = 'cook'
team_members[2].pin_hash = 'hash_of_3333'
```

### Example 2: Manager with Personal Account

```sql
-- Supabase Auth User
auth.users.email = 'maria.santos@restaurant.com'
auth.users.id = '660e8400-e29b-41d4-a716-446655440001'

-- Profile
profiles.user_id = '660e8400-e29b-41d4-a716-446655440001'
profiles.organization_id = 'org-123'
profiles.display_name = 'Maria Santos'

-- User Roles (can have multiple)
user_roles[0].user_id = '660e8400-e29b-41d4-a716-446655440001'
user_roles[0].role = 'manager'  -- Can manage team, schedules

user_roles[1].user_id = '660e8400-e29b-41d4-a716-446655440001'
user_roles[1].role = 'staff'    -- Also has staff access

-- Team Member (1:1 mapping)
team_members.auth_role_id = '660e8400-e29b-41d4-a716-446655440001'
team_members.display_name = 'Maria Santos'
team_members.role_type = 'manager'
team_members.position = 'Kitchen Manager'
team_members.pin_hash = 'hash_of_5678'
```

---

## 🎯 Use Cases

### Use Case 1: Check System Permissions

```sql
-- Can user create products?
SELECT has_any_role(
  auth.uid(), 
  ARRAY['admin', 'manager', 'leader_chef']::app_role[]
);
```

### Use Case 2: Get Current Team Member

```typescript
// In React app
const { currentMember } = useCurrentTeamMember();
// Returns team_members record for selected identity
```

### Use Case 3: Validate PIN for Profile Edit

```sql
-- Staff editing own profile needs PIN
SELECT verify_team_member_pin(
  team_member_id,
  entered_pin
);
```

### Use Case 4: Create Label with Prepared By

```sql
INSERT INTO labels (
  product_id,
  prepared_by,  -- team_members.id
  organization_id
) VALUES (...);
```

---

## 🔧 Migration Applied

**File:** `20260104000004_cleanup_profiles_user_roles.sql`

### Changes Made:

1. ✅ Removed `profiles.role` (deprecated)
2. ✅ Removed `profiles.location_id` (belongs to team_members)
3. ✅ Added FK constraint on `profiles.organization_id` with CASCADE
4. ✅ Made `profiles.organization_id` NOT NULL
5. ✅ Added performance indexes
6. ✅ Updated table comments

---

## ✅ Validation Queries

### Check profiles structure:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

### Check user_roles structure:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;
```

### Check team_members structure:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;
```

---

## 📚 Related Documentation

- [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md) - Full authentication architecture
- [TEAM_MEMBERS_ARCHITECTURE.md](./TEAM_MEMBERS_ARCHITECTURE.md) - Team members detailed design
- [SCHEMA_VERIFICATION_FEED_ITEMS.md](./SCHEMA_VERIFICATION_FEED_ITEMS.md) - Schema validation process

---

**Status:** ✅ Clean, organized, and ready for production use.
