# Onboarding Flow - Visual Guide

## 🎯 The 5-Step Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAMPA APP ONBOARDING                         │
│              "From Signup to Fully Operational"                 │
└─────────────────────────────────────────────────────────────────┘


Step 1: REGISTRATION
┌────────────────────────────────────────────────────┐
│  👤 Create Your Account                            │
│  ─────────────────────────────────────────         │
│  • First Name / Last Name                          │
│  • Email Address                                   │
│  • Password (with strength meter)                  │
│  • Terms & Conditions acceptance                   │
│                                                     │
│  Database Actions:                                 │
│  ✓ Create auth.users record                        │
│  ✓ Create profiles record                          │
└────────────────────────────────────────────────────┘
                        ↓
Step 2: COMPANY INFO
┌────────────────────────────────────────────────────┐
│  🏢 Tell Us About Your Business                    │
│  ─────────────────────────────────────────         │
│  • Business Type (7 options with icons)            │
│  • Business Name                                   │
│  • ABN / ACN (with validation)                     │
│  • Full Australian Address                         │
│  • Phone Number                                    │
│                                                     │
│  Database Actions:                                 │
│  ✓ Create organizations record                     │
│  ✓ Link user to organization                       │
│  ✓ Assign 'owner' role                             │
└────────────────────────────────────────────────────┘
                        ↓
Step 3: PRODUCTS (Optional)
┌────────────────────────────────────────────────────┐
│  📦 Add Your Products/Recipes                      │
│  ─────────────────────────────────────────         │
│  Two import methods:                               │
│  • Manual Entry (name, category, allergens)        │
│  • CSV Import (drag & drop with preview)           │
│                                                     │
│  Features:                                         │
│  • 10 allergen badges                              │
│  • CSV template download                           │
│  • Validation & preview                            │
│  • Skip option                                     │
│                                                     │
│  Database Actions:                                 │
│  ✓ Bulk insert to recipes table                    │
└────────────────────────────────────────────────────┘
                        ↓
Step 4: TEAM MEMBERS (Optional)
┌────────────────────────────────────────────────────┐
│  👥 Add Your Team Members                          │
│  ─────────────────────────────────────────         │
│  • 6 role types (cook, barista, chef, etc.)        │
│  • Display Name                                    │
│  • PIN (auto-generate or manual)                   │
│  • Optional: Email & Phone                         │
│  • Notes                                           │
│                                                     │
│  Features:                                         │
│  • PIN auto-generation                             │
│  • Show/hide PIN toggle                            │
│  • Duplicate PIN detection                         │
│  • Skip option                                     │
│                                                     │
│  Database Actions:                                 │
│  ✓ Hash PINs (SHA-256)                             │
│  ✓ Bulk insert to team_members table               │
└────────────────────────────────────────────────────┘
                        ↓
Step 5: INVITE USERS (Optional)
┌────────────────────────────────────────────────────┐
│  ✉️ Invite Auth Users                              │
│  ─────────────────────────────────────────         │
│  • 3 roles (admin, manager, leader_chef)           │
│  • Email address                                   │
│  • Personal message (optional)                     │
│                                                     │
│  Features:                                         │
│  • Role descriptions                               │
│  • Duplicate email detection                       │
│  • Personal message field                          │
│  • Skip option                                     │
│                                                     │
│  Database Actions:                                 │
│  ✓ Create user_invitations records                 │
│  ✓ Generate unique tokens                          │
│  ✓ Call Edge Function to send emails               │
│                                                     │
│  📧 Email Includes:                                │
│  • Beautiful HTML template                         │
│  • Personal message from inviter                   │
│  • Invitation link with token                      │
│  • 7-day expiration notice                         │
└────────────────────────────────────────────────────┘
                        ↓
COMPLETE! 🎉
┌────────────────────────────────────────────────────┐
│  ✨ You're All Set!                                │
│  ─────────────────────────────────────────         │
│  • Show success animation                          │
│  • Display summary of what was created             │
│  • "Go to Dashboard" button                        │
│                                                     │
│  Database Actions:                                 │
│  ✓ Mark onboarding_completed = true                │
│  ✓ Set onboarding_completed_at timestamp           │
│                                                     │
│  → Redirect to /dashboard                          │
└────────────────────────────────────────────────────┘
```

---

## 🎨 UI Components Map

```
/src/pages/Onboarding.tsx (Main Container)
    │
    ├── OnboardingSteps.tsx (Progress Indicator)
    │   └── Shows: 1●─2●─3●─4●─5○ with animations
    │
    ├── [Conditional Rendering Based on currentStep]
    │
    ├── RegistrationStep.tsx
    │   ├── Input: firstName
    │   ├── Input: lastName
    │   ├── Input: email
    │   ├── Input: password (with strength meter)
    │   ├── Input: confirmPassword (with match indicator)
    │   └── Checkbox: acceptTerms
    │
    ├── CompanyInfoStep.tsx
    │   ├── BusinessTypeSelector (7 cards with icons)
    │   ├── Input: businessName
    │   ├── Input: abn (with tooltip)
    │   ├── Input: acn (with tooltip)
    │   ├── AddressForm (5 fields)
    │   ├── Input: phone
    │   ├── Input: website (optional)
    │   └── Navigation: Back / Next
    │
    ├── ProductsStep.tsx
    │   ├── Tabs: Manual / CSV
    │   ├── [Manual Tab]
    │   │   ├── Input: name
    │   │   ├── Select: category
    │   │   ├── AllergenBadges (10 toggles)
    │   │   └── Textarea: description
    │   ├── [CSV Tab]
    │   │   ├── FileDropzone (drag & drop)
    │   │   ├── DownloadTemplate button
    │   │   ├── PreviewTable
    │   │   └── ValidationMessages
    │   └── Navigation: Back / Skip / Next
    │
    ├── TeamMembersStep.tsx
    │   ├── RoleSelector (6 cards with icons)
    │   ├── Input: displayName
    │   ├── PINInput (with generate button)
    │   ├── Input: email (optional)
    │   ├── Input: phone (optional)
    │   ├── Textarea: notes (optional)
    │   ├── AddedMembersList (cards with remove)
    │   └── Navigation: Back / Skip / Next
    │
    ├── InviteUsersStep.tsx
    │   ├── RoleSelector (3 cards with descriptions)
    │   ├── Input: email
    │   ├── Textarea: personalMessage (optional)
    │   ├── InvitationsList (preview cards)
    │   └── Navigation: Back / Skip / Next
    │
    └── CompleteScreen (currentStep === 'complete')
        ├── Emoji: 🎉
        ├── Heading: "You're All Set!"
        ├── Summary text
        └── Button: "Go to Dashboard"
```

---

## 🗄️ Database Entity Relationships

```
┌───────────────┐
│  auth.users   │ (Supabase Auth)
└───────┬───────┘
        │ 1
        │ creates
        ↓ N
┌───────────────┐      1       ┌─────────────────┐
│   profiles    │─────────────→│ organizations   │
│               │   belongs_to  │                 │
│ • display_name│               │ • business_type │
│ • email       │               │ • abn / acn     │
│ • onboarding_ │               │ • address_*     │
│   completed   │               │ • owner_id      │
└───────┬───────┘               └────────┬────────┘
        │                                 │
        │ N                              N│
        │                                 │
        ↓                                 ↓
┌───────────────┐               ┌─────────────────┐
│  user_roles   │               │  team_members   │
│               │               │                 │
│ • role        │               │ • display_name  │
│ • user_id     │               │ • pin_hash      │
│ • org_id      │               │ • role          │
└───────────────┘               └─────────────────┘

        │ N
        │
        ↓
┌────────────────────┐
│ user_invitations   │
│                    │
│ • email            │
│ • role             │
│ • token            │
│ • status           │
│ • expires_at       │
│ • invited_by       │
│ • organization_id  │
└────────────────────┘

┌─────────────────┐
│    recipes      │ (products)
│                 │
│ • name          │
│ • category      │
│ • allergens     │
│ • created_by    │
└─────────────────┘
```

---

## 🔄 Data Flow During Onboarding

```
USER ACTIONS                  REACT STATE              DATABASE OPERATIONS

[Fill Registration]
  email: test@example.com
  password: ••••••••
         │
         └──────────→  registrationData: {...}
                              │
                              │ (on Step 5 submit)
                              ↓
[All Steps Complete]    ─────────────────────────
         │              completeOnboarding()
         │                     │
         ↓                     ├→ registerUser()
                               │     ↓
[Submit Button]                │  CREATE auth.users
         │                     │  CREATE profiles
         │                     │
         │                     ├→ createOrganization()
         ↓                     │     ↓
                               │  CREATE organizations
[Loading Spinner]              │  UPDATE profiles.org_id
         │                     │  CREATE user_roles
         │                     │
         │                     ├→ importProducts()
         ↓                     │     ↓
                               │  BULK INSERT recipes
[Success Toast]                │
         │                     ├→ createTeamMembers()
         │                     │     ↓
         ↓                     │  HASH PINs (SHA-256)
                               │  BULK INSERT team_members
[Redirect to Dashboard]        │
                               ├→ sendUserInvitations()
                               │     ↓
                               │  CREATE user_invitations
                               │  CALL Edge Function
                               │  SEND Emails
                               │
                               └→ Mark Complete
                                     ↓
                                  UPDATE profiles
                                  SET onboarding_completed = true
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────┐
│  CLIENT SIDE (Browser)                          │
├─────────────────────────────────────────────────┤
│  • Input validation (regex, length, format)     │
│  • Password strength checking                   │
│  • Duplicate detection (client state)           │
│  • ABN/ACN checksum validation                  │
│  • PIN hashing (SHA-256) before send            │
└─────────────────────┬───────────────────────────┘
                      │
                      │ HTTPS
                      ↓
┌─────────────────────────────────────────────────┐
│  SUPABASE CLIENT LIBRARY                        │
├─────────────────────────────────────────────────┤
│  • JWT token management                         │
│  • Automatic token refresh                      │
│  • Request authentication                       │
│  • Session persistence                          │
└─────────────────────┬───────────────────────────┘
                      │
                      │ Authenticated Requests
                      ↓
┌─────────────────────────────────────────────────┐
│  EDGE FUNCTIONS (Deno Runtime)                  │
├─────────────────────────────────────────────────┤
│  • Token verification                           │
│  • Service role operations (admin API)          │
│  • Email sending                                │
│  • Rate limiting (TODO)                         │
└─────────────────────┬───────────────────────────┘
                      │
                      │
                      ↓
┌─────────────────────────────────────────────────┐
│  SUPABASE API LAYER                             │
├─────────────────────────────────────────────────┤
│  • Auth verification                            │
│  • RLS policy enforcement                       │
│  • Connection pooling                           │
│  • Query optimization                           │
└─────────────────────┬───────────────────────────┘
                      │
                      │
                      ↓
┌─────────────────────────────────────────────────┐
│  POSTGRESQL DATABASE                            │
├─────────────────────────────────────────────────┤
│  • Row-Level Security (RLS) policies            │
│  • Foreign key constraints                      │
│  • Check constraints                            │
│  • NOT NULL constraints                         │
│  • Unique constraints                           │
│  • Indexed columns                              │
└─────────────────────────────────────────────────┘
```

---

## 📧 Email Invitation Flow

```
[User invites admin@example.com]
          ↓
[Create invitation record in DB]
    • token: abc123...xyz789 (32 bytes, hex)
    • expires_at: now() + 7 days
    • status: 'pending'
          ↓
[Call Edge Function: send-invitation]
          ↓
    ┌─────────────────────────────┐
    │  Edge Function (Deno)       │
    │  • Verify JWT token         │
    │  • Get invitation data      │
    │  • Build email HTML         │
    │  • Call Supabase Admin API  │
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  Supabase Auth Admin        │
    │  • Create auth invitation   │
    │  • Queue email for sending  │
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  Email Service              │
    │  • Render HTML template     │
    │  • Add invitation link      │
    │  • Send via SMTP            │
    └─────────────┬───────────────┘
                  ↓
[Recipient receives beautiful HTML email]
          ↓
[Click "Accept Invitation" button]
          ↓
[Redirected to /accept-invitation?token=abc123...]
          ↓
[TODO: Acceptance flow not yet built]
    • Verify token
    • Check expiration
    • Set password
    • Assign role
    • Mark accepted
```

---

## 🎯 Feature Toggle States

```
Products Step
  ├─ If importMethod === 'manual':
  │    Show manual entry form
  │
  └─ If importMethod === 'csv':
       Show CSV upload UI

Team Members Step
  ├─ If skipForNow === true:
  │    Skip database operations
  │
  └─ If skipForNow === false:
       Create team_members records

Invite Users Step
  ├─ If skipForNow === true:
  │    Skip invitations
  │
  └─ If skipForNow === false:
       Send email invitations

PIN Input
  ├─ If showPin === true:
  │    Display PIN as text
  │
  └─ If showPin === false:
       Display PIN as ••••••

Password Input
  ├─ If showPassword === true:
  │    Display password as text
  │
  └─ If showPassword === false:
       Display password as ••••••
```

---

## 🚦 Loading & Error States

```
Initial State
    ↓
[User fills form]
    ↓
[User clicks Submit]
    ↓
┌─────────────────────┐
│ loading = true      │
│ Show spinner        │
│ Disable form        │
└─────────┬───────────┘
          ↓
   Database Operations
          │
    ┌─────┴─────┐
    │           │
SUCCESS        ERROR
    │           │
    ↓           ↓
┌───────┐  ┌──────────────┐
│ Show  │  │ error = msg  │
│ Toast │  │ Show alert   │
│       │  │ Enable form  │
└───┬───┘  └──────────────┘
    │
    ↓
[Redirect]
```

---

## 📱 Responsive Breakpoints

```
Mobile (< 640px)
├─ Single column layout
├─ Full-width cards
├─ Stacked form fields
└─ Touch-friendly buttons (min 44px)

Tablet (640px - 1024px)
├─ Two-column layout where appropriate
├─ Larger form spacing
└─ Side-by-side buttons

Desktop (> 1024px)
├─ Max width: 4xl (896px)
├─ Centered layout
├─ Optimal reading width
└─ Hover states on all interactive elements
```

---

## 🎨 Theme Colors

```
Primary Gradient
  from: #667eea (Indigo)
  to:   #764ba2 (Purple)

Background
  Light: #ffffff
  Dark:  #0f172a

Muted
  Light: #f1f5f9
  Dark:  #1e293b

Destructive
  #ef4444 (Red)

Success
  #10b981 (Green)

Borders
  #e2e8f0
```

---

This visual guide shows the complete architecture, data flow, and user journey through the onboarding system!
