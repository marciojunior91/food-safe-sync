// Onboarding types for the immersive client journey
// Iteration 13 - MVP Sprint

export type OnboardingStep = 
  | 'registration'
  | 'company-info'
  | 'products'
  | 'team-members'
  | 'invite-users'
  | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  canGoBack: boolean;
  canGoForward: boolean;
}

// Step 1: User Registration
export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptedTerms: boolean;
}

// Step 2: Company/Restaurant Information
export type BusinessType = 'restaurant' | 'bar' | 'cafe' | 'bakery' | 'hotel' | 'catering' | 'other';

export interface CompanyData {
  businessName: string;
  businessType: BusinessType;
  abn?: string; // Australian Business Number (optional)
  acn?: string; // Australian Company Number (optional)
  address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  phone: string;
  website?: string;
}

// Step 3: Product Import/Entry
export interface ProductImportData {
  importMethod: 'manual' | 'csv';
  products: ProductEntry[];
}

export interface ProductEntry {
  name: string;
  category: string;
  allergens?: string[];
  dietary_requirements?: string[];
  description?: string;
}

export interface CSVImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: CSVImportError[];
}

export interface CSVImportError {
  row: number;
  field: string;
  message: string;
}

// Step 4: Team Members Registration
export interface TeamMemberEntry {
  displayName: string;
  role: 'cook' | 'barista' | 'chef' | 'cleaner' | 'server' | 'other';
  pin: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface TeamMembersData {
  teamMembers: TeamMemberEntry[];
  skipForNow: boolean;
}

// Step 5: Invite Auth Users
export interface UserInvitation {
  email: string;
  role: 'admin' | 'manager' | 'leader_chef';
  personalMessage?: string;
}

export interface InviteUsersData {
  invitations: UserInvitation[];
  skipForNow: boolean;
}

// Complete onboarding data
export interface OnboardingData {
  registration: RegistrationData;
  company: CompanyData;
  products: ProductImportData;
  teamMembers: TeamMembersData;
  inviteUsers: InviteUsersData;
}

// Validation errors
export interface ValidationError {
  field: string;
  message: string;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Progress tracking
export interface OnboardingProgress {
  step: OnboardingStep;
  stepNumber: number;
  totalSteps: number;
  percentComplete: number;
}

// Australian states for address form
export const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
] as const;

// Business types with labels
export const BUSINESS_TYPES: { value: BusinessType; label: string; icon: string }[] = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Café', icon: '☕' },
  { value: 'bar', label: 'Bar/Pub', icon: '🍺' },
  { value: 'bakery', label: 'Bakery', icon: '🥖' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'catering', label: 'Catering', icon: '🚚' },
  { value: 'other', label: 'Other', icon: '🏢' },
];

// Step configuration
export const ONBOARDING_STEPS: { 
  id: OnboardingStep; 
  title: string; 
  description: string;
  optional: boolean;
}[] = [
  {
    id: 'registration',
    title: 'Create Account',
    description: 'Set up your user account',
    optional: false,
  },
  {
    id: 'company-info',
    title: 'Business Information',
    description: 'Tell us about your business',
    optional: false,
  },
  {
    id: 'products',
    title: 'Products & Recipes',
    description: 'Import or add your products',
    optional: true,
  },
  {
    id: 'team-members',
    title: 'Team Members',
    description: 'Add your operational staff',
    optional: true,
  },
  {
    id: 'invite-users',
    title: 'Invite Users',
    description: 'Invite managers and admins',
    optional: true,
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'You\'re all set!',
    optional: false,
  },
];
