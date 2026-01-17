# User Roles & Relationships - Complete Fix
## Sprint 2 Module 1 - People & Authentication

**Date**: January 10, 2026  
**Issue**: Missing roles in database, relationship integrity issues  
**Status**: ✅ Fixed with comprehensive migration

---

## 🔍 Problem Analysis

### **What We Found:**

1. **app_role enum** (user_roles table) had only: `admin`, `manager`, `leader_chef`, `staff`
2. **team_member_role enum** (team_members table) had: `cook`, `barista`, `manager`, `leader_chef`, `admin`
3. **Dialogs needed**: `admin`, `manager`, `leader_chef`, `cook`, `barista`
4. **Missing from app_role**: `cook` and `barista` ❌

### **Why This Matters:**

- Can't create users with cook/barista roles
- team_members role_type doesn't map to user_roles
- Broken relationship between authentication and team operations

---

## 🏗️ Database Relationship Structure

### **Correct Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                        auth.users                            │
│                 (Supabase Authentication)                    │
│                  Managed by Supabase                         │
└───────────────────────┬─────────────────────────────────────┘
                        │ 1:1
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                        profiles                              │
│  • user_id (FK → auth.users.id)                             │
│  • display_name, email, organization_id                     │
│  • One profile per auth user                                │
└───────────────────────┬─────────────────────────────────────┘
                        │ 1:1 ⚠️ UNIQUE CONSTRAINT
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                       user_roles                             │
│  • user_id (FK → auth.users.id) UNIQUE                      │
│  • role (app_role enum)                                      │
│  • Each user has exactly ONE role                           │
│  • CONSTRAINT: user_roles_user_id_unique                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ 1:N
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                     team_members                             │
│  • auth_role_id (FK → profiles.user_id)                     │
│  • Links team member to shared login                        │
│  • Multiple team members can share one auth account         │
│  • Each has 4-digit PIN for profile editing                 │
└─────────────────────────────────────────────────────────────┘
```

### **Key Relationships:**

| Table | Primary Key | Foreign Keys | Relationship Type |
|-------|-------------|--------------|-------------------|
| **auth.users** | id | - | Managed by Supabase |
| **profiles** | id | user_id → auth.users.id | 1:1 with auth.users |
| **user_roles** | id | user_id → auth.users.id (UNIQUE) | 1:1 with auth.users |
| **team_members** | id | auth_role_id → profiles.user_id | N:1 with profiles |

---

## 🔧 Migration Solution

### **File**: `supabase/migrations/20260110_fix_user_roles_relationships.sql`

### **What It Does:**

#### **1. Adds Missing Roles to app_role Enum**
```sql
ALTER TYPE app_role ADD VALUE 'cook';
ALTER TYPE app_role ADD VALUE 'barista';
```

**Result**: app_role now has all 6 roles: `admin`, `manager`, `leader_chef`, `cook`, `barista`, `staff`

#### **1B. Enforces ONE Role Per User (1:1 Relationship)**
```sql
-- Remove old constraint allowing multiple roles
ALTER TABLE user_roles DROP CONSTRAINT user_roles_user_id_role_key;

-- Add new constraint: ONE role per user
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
```

**Result**: Each user can have only ONE role. Existing duplicates removed (keeping highest priority).

#### **2. Updates Role Hierarchy Function**
```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
```

**Priority Order**: 
1. admin
2. manager
3. leader_chef
4. cook
5. barista
6. staff

#### **3. Auto-Sync Trigger**
```sql
CREATE TRIGGER sync_team_member_role_trigger
  AFTER INSERT OR UPDATE ON team_members
  EXECUTE FUNCTION sync_team_member_to_user_role();
```

**Behavior**: When you create/update a team_member with auth_role_id, automatically creates or UPDATES the ONE user_roles entry (UPSERT for 1:1 relationship)

#### **4. Backfills Existing Data**
```sql
-- Keeps only HIGHEST PRIORITY role per user
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT ON (auth_role_id) auth_role_id, role_type::app_role
FROM team_members
WHERE auth_role_id IS NOT NULL
ORDER BY auth_role_id, priority
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
```

**Result**: All existing team_members now have ONE corresponding user_role (highest priority if multiple existed)

#### **5. Creates Validation Function**
```sql
CREATE FUNCTION validate_user_relationships()
```

**Checks for**:
- Profiles without user_roles
- Team members with invalid auth_role_id
- Orphaned user_roles entries

#### **6. Creates Summary View**
```sql
CREATE VIEW user_roles_summary AS
SELECT user_id, display_name, role, team_member_count
```

**Usage**: Easy querying - each user shows their ONE role (1:1 relationship)

---

## 📋 How to Apply

### **Step 1: Run SQL in Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new
2. Copy contents of `supabase/migrations/20260110_fix_user_roles_relationships.sql`
3. Click **Run**

### **Step 2: Verify Success**

Check the console output:
- ✓ Should show "All relationships are valid!" 
- Or show specific issues found

### **Step 3: Test Queries**

```sql
-- View all user roles
SELECT * FROM user_roles_summary;

-- Check your own roles
SELECT * FROM get_current_user_context();

-- Validate relationships
SELECT * FROM validate_user_relationships();
```

---

## ✅ Code Changes (Already Applied)

### **Updated Files:**

1. ✅ `CreateUserDialog.tsx` - Now shows all 5 roles
2. ✅ `CreateTeamMemberDialog.tsx` - Now shows all 5 roles

### **Role Dropdown (Both Dialogs):**
```tsx
<SelectContent>
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="manager">Manager</SelectItem>
  <SelectItem value="leader_chef">Leader Chef</SelectItem>
  <SelectItem value="cook">Cook</SelectItem>
  <SelectItem value="barista">Barista</SelectItem>
</SelectContent>
```

---

## 🎯 Role Definitions

| Role | Description | Typical Use Case |
|------|-------------|------------------|
| **admin** | System administrator | Full access, manage users, settings |
| **manager** | Restaurant manager | Manage operations, staff, reports |
| **leader_chef** | Head chef | Manage recipes, tasks, kitchen |
| **cook** | Kitchen cook | Prepare food, follow recipes |
| **barista** | Beverage specialist | Make drinks, serve customers |
| **staff** | General staff | Default fallback role |

---

## 🔄 How It Works (End-to-End)

### **Creating a New User:**

1. **Admin opens "Add User" dialog**
2. **Fills form**: email, password, name, **role** (e.g., "cook")
3. **Edge function runs**: `create-user-with-credentials`
   - Creates auth user in `auth.users`
   - Creates profile in `profiles`
   - Creates user_role entry with role="cook"
   - Creates team_member with role_type="cook"
4. **Auto-sync trigger runs**: Ensures user_roles has cook role
5. **User can now login**: with cook@company.com credentials

### **After Login:**

1. User logs in with shared credentials (e.g., cook@company.com)
2. System fetches `get_current_user_context()` → returns role="cook"
3. User selects their team_member profile
4. Enters 4-digit PIN to access/edit profile
5. Works with permissions based on role

---

## 🧪 Testing Checklist

After applying migration:

- [ ] Run migration SQL in Supabase dashboard
- [ ] Verify no errors in console
- [ ] Check validation output shows "✓ All relationships are valid"
- [ ] Query `SELECT * FROM user_roles_summary;`
- [ ] Restart dev server (for .env changes)
- [ ] Open People module → Add User
- [ ] Verify dropdown shows all 5 roles
- [ ] Create test user with "cook" role
- [ ] Create test user with "barista" role
- [ ] Verify users created successfully
- [ ] Check both appear in Auth Users list
- [ ] Check both have team_member entries
- [ ] Test login with new accounts

---

## 📊 Database Queries for Verification

### **Check All Roles in System:**
```sql
SELECT enumlabel as role_name 
FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype 
ORDER BY enumsortorder;
```

**Expected**: admin, manager, leader_chef, staff, cook, barista

### **Check User Roles:**
```sql
SELECT 
  p.display_name,
  p.email,
  array_agg(ur.role::text) as roles
FROM profiles p
JOIN user_roles ur ON p.user_id = ur.user_id
GROUP BY p.display_name, p.email;
```

### **Check Team Members with Auth Links:**
```sql
SELECT 
  tm.display_name as team_member_name,
  tm.role_type,
  p.display_name as auth_user_name,
  p.email as auth_email,
  ur.role as user_role
FROM team_members tm
LEFT JOIN profiles p ON tm.auth_role_id = p.user_id
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
ORDER BY tm.display_name;
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Enum value already exists"**
**Solution**: The migration handles this with `IF NOT EXISTS` checks. Safe to re-run.

### **Issue 2: "Column auth_role_id does not exist"**
**Solution**: Ensure `20260103000000_create_team_members_table.sql` was applied first.

### **Issue 3: "Cannot cast type team_member_role to app_role"**
**Solution**: The migration adds the cast. Both enums now have matching values.

### **Issue 4: "No user_roles entry for my user"**
**Solution**: Run the backfill section of the migration again, or insert manually:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'admin');
```

---

## 📁 Related Files

**Migrations:**
- `20260110_fix_user_roles_relationships.sql` (new - main fix)
- `20260110_sync_profile_emails.sql` (email fix)
- `20260103000000_create_team_members_table.sql` (team_members table)
- `20251006205806_*.sql` (original user_roles creation)

**Components:**
- `src/components/people/CreateUserDialog.tsx` (updated)
- `src/components/people/CreateTeamMemberDialog.tsx` (updated)

**Edge Functions:**
- `supabase/functions/create-user-with-credentials/index.ts`

**Documentation:**
- `docs/USER_ROLES_FIX.md` (this file)
- `docs/PROFILE_EMAIL_FIX.md` (email issue)
- `docs/DIALOG_LAYOUT_IMPROVEMENTS.md` (UI improvements)

---

## 📝 Summary

### **Before:**
- ❌ user_roles missing cook and barista
- ❌ No auto-sync between team_members and user_roles
- ❌ Can't create users with operational roles
- ❌ Relationship integrity not validated
- ❌ Users could have multiple roles (confusing permissions)

### **After:**
- ✅ All 6 roles available in app_role enum
- ✅ Auto-sync trigger keeps roles in sync (UPSERT)
- ✅ Backfilled existing data (keeping highest priority role)
- ✅ Validation function to check integrity
- ✅ Dialogs support all roles
- ✅ Complete documentation of relationships
- ✅ **1:1 relationship enforced: ONE role per user**

---

**Status**: ✅ Complete - Ready for Testing  
**Author**: AI Assistant  
**Sprint**: Sprint 2 Module 1 - People & Authentication  
**Date**: January 10, 2026
