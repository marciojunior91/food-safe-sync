# Team Members System - Progress Update

## ✅ Completed Tasks

### 1. Database Migration
- **File**: `supabase/migrations/20260103000000_create_team_members_table.sql`
- **Status**: ✅ Applied successfully
- **Content**:
  - Created `team_member_role` enum
  - Created `team_members` table with 15 columns
  - 7 performance indexes (including full-text search)
  - 4 RLS policies for security
  - 3 automatic triggers (updated_at, profile completion, feed notification)
  - Helper functions for profile completion tracking

### 2. PIN Verification RPC Function
- **File**: `supabase/migrations/20260103000001_verify_pin_rpc.sql`
- **Status**: ⏳ Ready to apply
- **Content**:
  - Secure PIN verification with timing-safe comparison
  - Prevents timing attacks
  - Uses SHA-256 hashing

### 3. Team Members Hook
- **File**: `src/hooks/useTeamMembers.ts`
- **Status**: ✅ Complete
- **Features**:
  - `fetchTeamMembers(filters?)` - Load with optional filters
  - `fetchTeamMember(id)` - Get single member
  - `createTeamMember(input)` - Create new member with auto-PIN generation
  - `updateTeamMember(id, updates)` - Update member data
  - `deactivateTeamMember(id)` - Soft delete
  - `reactivateTeamMember(id)` - Reactivate member
  - `verifyPIN(memberId, pin)` - Verify PIN via RPC
  - `getTeamMembersByRole(role)` - Filter by role
  - `getTeamMembersByAuthRole(authRoleId)` - Filter by auth account
  - `getIncompleteProfiles()` - Get incomplete profiles

### 4. Team Member Selector Component
- **File**: `src/components/people/TeamMemberSelector.tsx`
- **Status**: ✅ Complete
- **Features**:
  - Beautiful card-based UI with avatars
  - Real-time search by name, email, or position
  - Shows profile completion status
  - PIN verification on selection
  - Responsive grid layout
  - Error handling

### 5. Supporting Files (Already Created)
- ✅ `src/utils/pinUtils.ts` - PIN hashing and verification utilities
- ✅ `src/components/people/PINInput.tsx` - 4-digit PIN input dialog
- ✅ `src/types/teamMembers.ts` - TypeScript types and interfaces
- ✅ `docs/TEAM_MEMBERS_ARCHITECTURE.md` - Complete system documentation

---

## 🔄 Next Steps

### Step 1: Apply PIN Verification RPC Migration
**Action Required**: Execute the SQL in Supabase Studio

1. Open Supabase Dashboard → SQL Editor
2. Copy content from: `supabase/migrations/20260103000001_verify_pin_rpc.sql`
3. Run the SQL
4. Verify: Should see "Success. No rows returned"

**Verification Query**:
```sql
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'verify_team_member_pin';
```

---

### Step 2: Update UserContext
**File to modify**: `src/contexts/UserContext.tsx`

**Changes needed**:
```typescript
// Add to context state
interface UserContextType {
  // ... existing fields
  selectedTeamMember: TeamMember | null;
  selectTeamMember: (member: TeamMember) => void;
  clearTeamMember: () => void;
}

// Add to context provider
const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(() => {
  const stored = sessionStorage.getItem('selected_team_member');
  return stored ? JSON.parse(stored) : null;
});

const selectTeamMember = (member: TeamMember) => {
  setSelectedTeamMember(member);
  sessionStorage.setItem('selected_team_member', JSON.stringify(member));
};

const clearTeamMember = () => {
  setSelectedTeamMember(null);
  sessionStorage.removeItem('selected_team_member');
};
```

---

### Step 3: Integrate TeamMemberSelector into Auth Flow
**Files to modify**: 
- `src/App.tsx` or routing file
- Auth redirect logic

**Concept**:
```typescript
// After successful login
const handleLoginSuccess = async (user) => {
  // Check if this is a shared account
  const isSharedAccount = await checkIfSharedAccount(user.email);
  
  if (isSharedAccount) {
    // Redirect to team member selection
    navigate('/select-team-member');
  } else {
    // Direct admin/owner account - proceed to dashboard
    navigate('/dashboard');
  }
};
```

**Create new route**:
```typescript
<Route 
  path="/select-team-member" 
  element={
    <TeamMemberSelector
      authRoleId={user.id}
      organizationId={user.organization_id}
      onSelect={(member) => {
        selectTeamMember(member);
        navigate('/dashboard');
      }}
      onCancel={() => {
        supabase.auth.signOut();
        navigate('/login');
      }}
    />
  } 
/>
```

---

### Step 4: Refactor People Module Components
**Files to update**:
- `src/pages/PeopleModule.tsx`
- `src/components/people/PeopleList.tsx`
- `src/components/people/UserProfile.tsx`
- `src/components/people/EditUserDialog.tsx`

**Key changes**:

#### PeopleModule.tsx
```typescript
// Replace usePeople with useTeamMembers
import { useTeamMembers } from '@/hooks/useTeamMembers';

const { 
  teamMembers, 
  loading, 
  fetchTeamMembers 
} = useTeamMembers();
```

#### EditUserDialog.tsx
```typescript
// Add PIN verification for self-editing
const isSelfEdit = selectedTeamMember?.id === memberToEdit.id;

if (isSelfEdit) {
  // Show PIN input first
  const pinVerified = await verifyPIN(memberToEdit.id, enteredPin);
  if (!pinVerified) {
    showError('Invalid PIN');
    return;
  }
}

// Proceed with edit
await updateTeamMember(memberToEdit.id, updates);
```

---

### Step 5: Create Data Migration Script
**Purpose**: Migrate existing profiles to team_members table

**File**: `scripts/migrate_to_team_members.sql`

**Steps**:
1. Create shared auth accounts per organization
2. Migrate existing profile data to team_members
3. Generate random PINs for each team member
4. Link team members to appropriate auth accounts
5. Export PINs for distribution to staff

**Important**: Run this script AFTER testing with new team members first!

---

### Step 6: Add "Switch Profile" Feature
**For shared accounts**: Allow switching between team member profiles

**UI Location**: User menu dropdown

```typescript
// In UserMenu component
{isSharedAccount && (
  <DropdownMenuItem onClick={() => navigate('/select-team-member')}>
    <Users className="mr-2 h-4 w-4" />
    Switch Profile
  </DropdownMenuItem>
)}
```

---

## 📋 Testing Checklist

### Unit Tests
- [ ] PIN hashing produces consistent results
- [ ] PIN verification correctly validates/rejects PINs
- [ ] Team member CRUD operations work
- [ ] Filters work correctly in useTeamMembers

### Integration Tests
- [ ] Shared login redirects to team member selection
- [ ] Team members filtered correctly by auth role
- [ ] PIN verification dialog appears on selection
- [ ] Correct PIN allows access to dashboard
- [ ] Incorrect PIN shows error and stays on selection screen
- [ ] Selected team member persists in session storage
- [ ] Team member selection appears in user context

### UI/UX Tests
- [ ] TeamMemberSelector UI is responsive
- [ ] Search works in real-time
- [ ] Profile completion badges show correctly
- [ ] Avatar initials display properly
- [ ] Loading states show appropriately
- [ ] Error messages are clear and helpful

### Security Tests
- [ ] RLS policies prevent unauthorized access
- [ ] PIN verification uses timing-safe comparison
- [ ] PINs are properly hashed (never stored plain)
- [ ] Team members can only edit self with PIN
- [ ] Admins can edit without PIN
- [ ] Deactivated members cannot be selected

### Profile Completion Tests
- [ ] Required fields tracked correctly
- [ ] Feed notification created for incomplete profiles
- [ ] Profile completion updates automatically
- [ ] Missing fields array populated correctly

---

## 🎯 Success Criteria

### Functionality
- ✅ Team members table created successfully
- ⏳ PIN verification RPC function deployed
- ✅ Team members can be created with auto-generated PINs
- ⏳ Shared login redirects to team member selection
- ⏳ PIN verification works before allowing access
- ⏳ Selected team member stored in context
- ⏳ People module displays team_members data
- ⏳ Self-editing requires PIN verification
- ⏳ Admin/Manager/Leader Chef can edit without PIN

### User Experience
- Clear and intuitive team member selection interface
- Fast search and filtering
- Helpful error messages
- Profile completion tracking visible
- Easy PIN entry (4-digit with auto-focus)
- Session persistence (stay logged in as selected member)

### Security
- PINs properly hashed with SHA-256
- Timing-safe PIN comparison
- RLS policies enforce organization boundaries
- Audit trail (created_by, updated_by tracked)
- Soft deletes (deactivate, not delete)

---

## 📝 Current Implementation Status

```
Phase 1: Foundation ✅
├── Database schema ✅
├── PIN utilities ✅
├── TypeScript types ✅
├── PINInput component ✅
└── Documentation ✅

Phase 2: Core Features ✅
├── PIN verification RPC ✅ (needs deployment)
├── useTeamMembers hook ✅
└── TeamMemberSelector component ✅

Phase 3: Integration ⏳
├── Update UserContext ⏳
├── Auth flow integration ⏳
├── People module refactor ⏳
└── Switch profile feature ⏳

Phase 4: Migration ⏳
├── Data migration script ⏳
├── PIN distribution ⏳
└── Testing ⏳
```

---

## 🚀 Quick Start for Testing

### 1. Create First Test Team Member

Run in Supabase SQL Editor:

```sql
-- Get your organization ID
SELECT id, name FROM organizations LIMIT 1;

-- Get a shared auth account ID (or create one)
SELECT user_id, email FROM profiles WHERE email = 'cook@yourorg.com';

-- Create test team member
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  auth_role_id,
  pin_hash
) VALUES (
  'João Silva',
  'joao.silva@email.com',
  '+5511999999999',
  'Head Chef',
  '2024-01-15',
  'cook',
  'your-org-id-here',
  'auth-role-id-here',
  -- PIN: 1234 (for testing)
  'a1b2c3d4e5f6g7h8' || encode(digest('a1b2c3d4e5f6g7h8' || '1234', 'sha256'), 'hex')
);
```

### 2. Test Team Member Selection

1. Login with shared account (cook@yourorg.com)
2. Should redirect to TeamMemberSelector
3. Search for "João"
4. Click on João Silva card
5. Enter PIN: 1234
6. Should redirect to dashboard with João selected

### 3. Verify in Console

```javascript
// Check session storage
console.log(JSON.parse(sessionStorage.getItem('selected_team_member')));

// Should show:
// { id: '...', display_name: 'João Silva', ... }
```

---

## 🆘 Troubleshooting

### PIN Verification Always Fails
- Check if RPC function is deployed
- Verify PIN hash format in database
- Test hash generation: `SELECT encode(digest('salt' || '1234', 'sha256'), 'hex')`

### Team Members Not Loading
- Check RLS policies are enabled
- Verify user is authenticated
- Check organization_id matches
- Look for errors in browser console

### TeamMemberSelector Not Showing
- Verify auth_role_id is set on team members
- Check is_active = true
- Verify organization_id is correct

### Profile Completion Not Updating
- Check if trigger `check_team_member_completion` exists
- Verify required fields array
- Test trigger: Update a team member and check profile_complete field

---

## 📞 Next Actions for You

1. **Apply RPC Migration**: Copy and run `20260103000001_verify_pin_rpc.sql` in Supabase SQL Editor
2. **Test**: Report back if the RPC function was created successfully
3. **Next Step**: I'll help you update UserContext and integrate the auth flow

Ready to proceed? 🚀
