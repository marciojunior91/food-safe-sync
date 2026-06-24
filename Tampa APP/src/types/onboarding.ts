// Onboarding types for the immersive client journey
// Iteration 13 - MVP Sprint

export type OnboardingStep =
  | 'company-info'
  | 'categories'
  | 'team-members'
  | 'venues'
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
  role: 'admin' | 'manager' | 'staff';
  pin: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface TeamMembersData {
  teamMembers: TeamMemberEntry[];
  skipForNow: boolean;
}

// Backbone Step: Label Categories & Subcategories
export interface SubcategoryEntry {
  name: string;
  icon: string;
}

export interface CategoryEntry {
  name: string;
  icon: string;
  subcategories: SubcategoryEntry[];
}

export interface CategoriesData {
  categories: CategoryEntry[];
  // Whether the user kept the recommended default layout (didn't customise)
  usedDefault: boolean;
}

// Backbone Step: Venues (gated by plan once Stripe is live)
export interface VenueEntry {
  name: string;
  venueLabel?: string;
}

export interface VenuesData {
  venues: VenueEntry[];
  skipForNow: boolean;
}

// Step 5: Invite Auth Users
export interface UserInvitation {
  email: string;
  role: 'admin' | 'manager';
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
    id: 'company-info',
    title: 'Business Information',
    description: 'Tell us about your business',
    optional: false,
  },
  {
    id: 'categories',
    title: 'Categories',
    description: 'Set up your label categories & subcategories',
    optional: false,
  },
  {
    id: 'team-members',
    title: 'Team Members',
    description: 'Add your operational staff',
    optional: true,
  },
  {
    id: 'venues',
    title: 'Venues',
    description: 'Add the locations you operate',
    optional: true,
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'You\'re all set!',
    optional: false,
  },
];

// Recommended default label taxonomy offered to new users who don't want to
// customise. Each category carries an emoji icon and a set of subcategories.
export const DEFAULT_TAXONOMY: CategoryEntry[] = [
  {
    name: 'Proteins',
    icon: '🥩',
    subcategories: [
      { name: 'Beef', icon: '🐄' },
      { name: 'Poultry', icon: '🍗' },
      { name: 'Pork', icon: '🥓' },
      { name: 'Seafood', icon: '🐟' },
      { name: 'Eggs', icon: '🥚' },
    ],
  },
  {
    name: 'Dairy',
    icon: '🧀',
    subcategories: [
      { name: 'Milk', icon: '🥛' },
      { name: 'Cheese', icon: '🧀' },
      { name: 'Yoghurt', icon: '🍦' },
      { name: 'Butter', icon: '🧈' },
    ],
  },
  {
    name: 'Produce',
    icon: '🥬',
    subcategories: [
      { name: 'Vegetables', icon: '🥕' },
      { name: 'Fruits', icon: '🍎' },
      { name: 'Herbs', icon: '🌿' },
      { name: 'Salads', icon: '🥗' },
    ],
  },
  {
    name: 'Bakery',
    icon: '🥖',
    subcategories: [
      { name: 'Bread', icon: '🍞' },
      { name: 'Pastry', icon: '🥐' },
      { name: 'Dough', icon: '🥯' },
    ],
  },
  {
    name: 'Sauces & Stocks',
    icon: '🥫',
    subcategories: [
      { name: 'Sauces', icon: '🥫' },
      { name: 'Dressings', icon: '🫙' },
      { name: 'Stocks', icon: '🍲' },
      { name: 'Marinades', icon: '🧂' },
    ],
  },
  {
    name: 'Mise en place',
    icon: '🍱',
    subcategories: [
      { name: 'Cooked', icon: '♨️' },
      { name: 'Thawing', icon: '🧊' },
      { name: 'Marinating', icon: '⏲️' },
      { name: 'Cut / Prepped', icon: '🔪' },
    ],
  },
  {
    name: 'Dry Goods',
    icon: '🌾',
    subcategories: [
      { name: 'Grains', icon: '🌾' },
      { name: 'Pasta', icon: '🍝' },
      { name: 'Flour', icon: '🌽' },
      { name: 'Spices', icon: '🌶️' },
    ],
  },
  {
    name: 'Beverages',
    icon: '🥤',
    subcategories: [
      { name: 'Juices', icon: '🧃' },
      { name: 'Syrups', icon: '🍯' },
    ],
  },
];
