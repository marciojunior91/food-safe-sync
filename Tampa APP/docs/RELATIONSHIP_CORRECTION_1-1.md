# ✅ Relationship Correction: 1:1 for user_roles

**Date**: January 10, 2026  
**Corrected By**: User feedback  

---

## 🔄 What Was Corrected

### **Original (Incorrect):**
```
auth.users → profiles → user_roles (1:N) → team_members
                      ❌ Users could have MULTIPLE roles
```

### **Corrected:**
```
auth.users → profiles → user_roles (1:1) → team_members
                      ✅ Each user has EXACTLY ONE role
```

---

## 🛠️ Changes Made to Migration

### **1. Added UNIQUE Constraint**
```sql
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
```
- **Effect**: Enforces ONE role per user at database level
- **Previous**: Could have multiple roles per user (admin + cook + barista)
- **Now**: Each user has exactly ONE role

### **2. Updated Sync Function**
```sql
ON CONFLICT (user_id) 
DO UPDATE SET role = EXCLUDED.role
```
- **Effect**: UPSERT behavior - updates existing role instead of creating duplicate
- **Previous**: `ON CONFLICT (user_id, role) DO NOTHING` - allowed multiple
- **Now**: Replaces the ONE role if it changes

### **3. Updated Backfill Logic**
```sql
SELECT DISTINCT ON (auth_role_id) auth_role_id, role_type
ORDER BY priority
```
- **Effect**: Keeps only highest priority role per user
- **Previous**: Could insert multiple roles per user
- **Now**: Ensures ONE role per user (highest priority wins)

### **4. Updated Comments & Documentation**
- All comments now reflect 1:1 relationship
- View shows single `role` column instead of `roles` array
- Summary emphasizes "ONE role per user"

---

## 📊 Relationship Table (Final)

| From | To | Type | Constraint | Notes |
|------|-----|------|-----------|-------|
| auth.users | profiles | 1:1 | user_id UNIQUE | One profile per auth user |
| profiles | user_roles | **1:1** | **user_id UNIQUE** | **ONE role per user** |
| profiles | team_members | 1:N | auth_role_id | Multiple team members per auth account |

---

## 🎯 Why This Matters

### **Security & Clarity:**
- **Before**: User with `admin` + `cook` roles → Which permissions apply?
- **After**: User has `admin` role → Clear permission set

### **Simplicity:**
- **Before**: Complex logic to determine "primary" role from multiple
- **After**: User has ONE role, simple to check

### **Business Logic:**
- Each auth account represents ONE role (cook@company.com, admin@company.com)
- Team members share these role-based accounts
- Clear hierarchy: admin > manager > leader_chef > cook > barista > staff

---

## ✅ Files Updated

1. **Migration**: `supabase/migrations/20260110_fix_user_roles_relationships.sql`
   - Added UNIQUE constraint
   - Updated sync function (UPSERT)
   - Fixed backfill (DISTINCT ON)
   - Updated all comments

2. **Documentation**: `docs/USER_ROLES_COMPLETE_FIX.md`
   - Corrected relationship diagrams
   - Updated table showing 1:1
   - Fixed all references to "multiple roles"

3. **No Code Changes Needed**:
   - Dialogs already enforce single role selection
   - Edge function creates one role per user
   - Frontend assumes one role per user

---

## 🧪 Testing

### **Verify Constraint:**
```sql
-- Should fail (duplicate user_id):
INSERT INTO user_roles (user_id, role) VALUES ('same-uuid', 'admin');
INSERT INTO user_roles (user_id, role) VALUES ('same-uuid', 'cook');
-- ERROR: duplicate key value violates unique constraint "user_roles_user_id_unique"
```

### **Verify View:**
```sql
SELECT * FROM user_roles_summary;
-- Each user shows ONE role (not an array)
```

### **Verify Current User:**
```sql
SELECT * FROM get_current_user_context();
-- Returns ONE role as text, not array
```

---

## 📝 Summary

**Correction**: Changed user_roles from 1:N to **1:1** relationship  
**Reason**: Each user should have exactly ONE role for clarity and security  
**Implementation**: UNIQUE constraint + UPSERT logic + documentation updates  
**Status**: ✅ Corrected in migration and docs  

---

**Thank you for the correction!** The relationship structure is now accurate and enforced at the database level. 🎉
