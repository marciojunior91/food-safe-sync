# CRITICAL: Type Generation Required ⚠️

**Date:** January 7, 2026  
**Issue:** TypeScript compilation errors due to outdated Supabase types  
**Priority:** HIGH - Must be done before testing

---

## 🚨 Problem

The Supabase TypeScript client types (`src/integrations/supabase/types.ts`) are auto-generated from the database schema. Our new migrations added tables and columns that don't exist in the current type definitions.

### Affected Tables/Columns
1. **user_invitations** - Entire table missing from types
2. **user_roles** - Missing 'owner' role type
3. **profiles** - Missing `email`, `onboarding_completed`, `onboarding_completed_at` columns
4. **organizations** - Missing `business_type`, `abn`, `acn`, address fields, `owner_id`

### Current Errors
```
❌ Property 'email' does not exist in type 'profiles'
❌ Property 'onboarding_completed' does not exist in type 'profiles'
❌ Table 'user_invitations' not found in Supabase types
❌ Role 'owner' not valid (only 'admin', 'manager', 'leader_chef', 'staff')
```

---

## ✅ Solution

### Step 1: Apply Migrations to Local Supabase

```powershell
# Start local Supabase (if not running)
npx supabase start

# Apply the new migrations
npx supabase migration up

# Verify tables exist
npx supabase db diff --schema public
```

### Step 2: Regenerate TypeScript Types

```powershell
# Generate types from local database
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# This will read the actual database schema and create TypeScript interfaces
```

### Step 3: Verify Compilation

```powershell
# Check for TypeScript errors
npm run build

# Or just type-check without building
npx tsc --noEmit
```

---

## 📋 Manual Alternative (If Supabase CLI Issues)

If you don't have local Supabase running, you can manually update the type file:

### Update `src/integrations/supabase/types.ts`

Add to the `Tables` interface:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      
      user_invitations: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'manager' | 'leader_chef';
          organization_id: string;
          invited_by: string;
          personal_message: string | null;
          status: 'pending' | 'accepted' | 'expired' | 'cancelled';
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'admin' | 'manager' | 'leader_chef';
          organization_id: string;
          invited_by: string;
          personal_message?: string | null;
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
          token?: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'manager' | 'leader_chef';
          organization_id?: string;
          invited_by?: string;
          personal_message?: string | null;
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_invitations_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'manager' | 'leader_chef';
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'owner' | 'admin' | 'manager' | 'leader_chef';
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'manager' | 'leader_chef';
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  };
}
```

Update the `profiles` table type to add:
```typescript
profiles: {
  Row: {
    // ... existing fields ...
    email: string | null;
    onboarding_completed: boolean;
    onboarding_completed_at: string | null;
  };
  Insert: {
    // ... existing fields ...
    email?: string | null;
    onboarding_completed?: boolean;
    onboarding_completed_at?: string | null;
  };
  Update: {
    // ... existing fields ...
    email?: string | null;
    onboarding_completed?: boolean;
    onboarding_completed_at?: string | null;
  };
}
```

Update the `organizations` table type to add:
```typescript
organizations: {
  Row: {
    // ... existing fields ...
    business_type: 'restaurant' | 'café' | 'bar' | 'bakery' | 'hotel' | 'catering' | 'other' | null;
    abn: string | null;
    acn: string | null;
    address_street: string | null;
    address_city: string | null;
    address_state: string | null;
    address_postcode: string | null;
    address_country: string | null;
    owner_id: string | null;
  };
  Insert: {
    // ... existing fields ...
    business_type?: 'restaurant' | 'café' | 'bar' | 'bakery' | 'hotel' | 'catering' | 'other' | null;
    abn?: string | null;
    acn?: string | null;
    address_street?: string | null;
    address_city?: string | null;
    address_state?: string | null;
    address_postcode?: string | null;
    address_country?: string | null;
    owner_id?: string | null;
  };
  Update: {
    // ... existing fields ...
    business_type?: 'restaurant' | 'café' | 'bar' | 'bakery' | 'hotel' | 'catering' | 'other' | null;
    abn?: string | null;
    acn?: string | null;
    address_street?: string | null;
    address_city?: string | null;
    address_state?: string | null;
    address_postcode?: string | null;
    address_country?: string | null;
    owner_id?: string | null;
  };
}
```

---

## ⚙️ Edge Function Errors (Expected)

The errors in `/supabase/functions/send-invitation/index.ts` are **EXPECTED** and **SAFE TO IGNORE**:

```
❌ Cannot find name 'Deno'
❌ Cannot find module 'https://deno.land/...'
```

**Why:** Edge Functions run in Deno runtime, not Node.js. Your IDE is checking with TypeScript/Node types.

**They work fine when deployed:**
```powershell
npx supabase functions deploy send-invitation
```

---

## 🔄 Complete Setup Workflow

### Full Local Development Setup

```powershell
# 1. Ensure Supabase is running
npx supabase status

# If not running:
npx supabase start

# 2. Apply migrations
npx supabase migration up

# 3. Regenerate types
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# 4. Deploy Edge Functions
npx supabase functions deploy send-invitation

# 5. Verify no TypeScript errors
npm run build

# 6. Start dev server
npm run dev
```

### Production Deployment

```powershell
# 1. Link to your Supabase project
npx supabase link --project-ref your-project-ref

# 2. Push migrations to production
npx supabase db push

# 3. Deploy Edge Functions to production
npx supabase functions deploy send-invitation --project-ref your-project-ref

# 4. Deploy frontend
npm run build
vercel --prod
```

---

## 📝 Verification Checklist

After regenerating types, verify these work:

```typescript
// ✅ Should work after type regen
const { data } = await supabase
  .from('user_invitations')
  .insert({ email: 'test@example.com', ... })

const { data } = await supabase
  .from('user_roles')
  .insert({ role: 'owner', ... })

const { data } = await supabase
  .from('profiles')
  .update({ 
    email: 'test@example.com',
    onboarding_completed: true 
  })

const { data } = await supabase
  .from('organizations')
  .insert({ 
    business_type: 'restaurant',
    abn: '12345678901',
    owner_id: userId 
  })
```

---

## 🎯 Action Items

**Immediate (Before Testing):**
- [ ] Run `npx supabase start`
- [ ] Run `npx supabase migration up`
- [ ] Run `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`
- [ ] Run `npm run build` to verify no errors

**Before Production:**
- [ ] Run `npx supabase db push` (push migrations to prod)
- [ ] Run `npx supabase functions deploy send-invitation` (deploy Edge Function)
- [ ] Test complete onboarding flow
- [ ] Verify email delivery

---

## 💡 Pro Tips

1. **Always regenerate types after migrations:**
   ```powershell
   npx supabase migration up && npx supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```

2. **Keep types in sync with database:**
   - Add to pre-commit hook
   - Or run after every migration

3. **Edge Function testing locally:**
   ```powershell
   npx supabase functions serve send-invitation
   ```

4. **Check migration status:**
   ```powershell
   npx supabase migration list
   ```

---

**Status:** Waiting for type regeneration to complete onboarding integration testing.
