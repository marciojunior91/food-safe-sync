// ============================================================================
// Team Members Types - Separated from Authentication
// ============================================================================

export type TeamMemberRole = 
  | 'cook'
  | 'barista'
  | 'manager'
  | 'leader_chef'
  | 'admin';

export interface TeamMember {
  id: string;
  display_name: string;
  email?: string;
  phone?: string;
  position?: string;
  
  // New personal information fields
  date_of_birth?: string; // ISO date string
  address?: string;
  tfn_number?: string; // Tax File Number / Carteira de Trabalho
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Employment information
  hire_date?: string;
  department_id?: string;
  role_type: TeamMemberRole;
  is_active: boolean;
  
  // Authentication
  auth_role_id?: string; // Links to shared login account (profiles.user_id)
  pin_hash?: string;
  
  // Profile completion tracking
  profile_complete: boolean;
  required_fields_missing?: string[];
  
  // Organization & Location
  organization_id: string;
  location_id?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateTeamMemberInput {
  display_name: string;
  email?: string;
  phone?: string;
  position?: string;
  
  // Personal information
  date_of_birth?: string;
  address?: string;
  tfn_number?: string;
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Employment
  hire_date?: string;
  department_id?: string;
  role_type: TeamMemberRole;
  auth_role_id?: string;
  pin?: string; // Will be hashed before storage
  organization_id: string;
  location_id?: string;
}

export interface UpdateTeamMemberInput {
  display_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  
  // Personal information
  date_of_birth?: string;
  address?: string;
  tfn_number?: string;
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Employment
  hire_date?: string;
  department_id?: string;
  role_type?: TeamMemberRole;
  pin?: string; // New PIN to hash and update
  is_active?: boolean;
}

export interface TeamMemberFilters {
  role_type?: TeamMemberRole | 'all';
  department_id?: string;
  location_id?: string;
  organization_id?: string;
  auth_role_id?: string;
  is_active?: boolean;
  profile_complete?: boolean;
  search?: string;
}

export interface TeamMemberWithAuth extends TeamMember {
  auth_email?: string; // Email from linked auth account
  auth_role?: string; // Role from user_roles table
}

// Helper constants
export const TEAM_MEMBER_ROLE_LABELS: Record<TeamMemberRole, string> = {
  cook: 'Cook',
  barista: 'Barista',
  manager: 'Manager',
  leader_chef: 'Leader Chef',
  admin: 'Admin'
};

export const TEAM_MEMBER_ROLE_COLORS: Record<TeamMemberRole, string> = {
  cook: 'bg-blue-100 text-blue-800 border-blue-200',
  barista: 'bg-green-100 text-green-800 border-green-200',
  manager: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  leader_chef: 'bg-orange-100 text-orange-800 border-orange-200',
  admin: 'bg-red-100 text-red-800 border-red-200'
};

export const TEAM_MEMBER_ROLE_ICONS: Record<TeamMemberRole, string> = {
  cook: '🔵',
  barista: '🟢',
  manager: '🟡',
  leader_chef: '🟠',
  admin: '🔴'
};

// Required fields for profile completion
export const REQUIRED_TEAM_MEMBER_FIELDS = [
  'display_name',
  'date_of_birth',
  'email',
  'phone',
  'address',
  'position',
  'hire_date',
  'tfn_number', // Recommended
  'emergency_contact' // Recommended
];

export const REQUIRED_FIELD_LABELS: Record<string, string> = {
  display_name: 'Full Name',
  date_of_birth: 'Date of Birth',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  position: 'Position',
  hire_date: 'Hire Date',
  tfn_number: 'TFN / Tax File Number',
  emergency_contact: 'Emergency Contact'
};

// ============================================================================
// TEAM MEMBER CERTIFICATES
// ============================================================================

export type CertificateStatus = 'active' | 'expired' | 'pending' | 'rejected';
export type CertificateVerificationStatus = 'pending' | 'verified' | 'rejected';
export type CertificateType = 
  | 'food_safety'
  | 'first_aid'
  | 'license'
  | 'training'
  | 'qualification'
  | 'other';

export interface TeamMemberCertificate {
  id: string;
  team_member_id: string;
  
  // Certificate Information
  certificate_name: string;
  certificate_type?: CertificateType;
  description?: string;
  
  // File Information
  file_url: string; // Supabase Storage URL
  file_type?: string; // MIME type
  file_size?: number; // in bytes
  
  // Certificate Validity
  issue_date?: string;
  expiration_date?: string;
  issued_by?: string;
  certificate_number?: string;
  
  // Status
  status: CertificateStatus;
  verification_status: CertificateVerificationStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCertificateInput {
  team_member_id: string;
  certificate_name: string;
  certificate_type?: CertificateType;
  description?: string;
  file: File; // Will be uploaded to Supabase Storage
  issue_date?: string;
  expiration_date?: string;
  issued_by?: string;
  certificate_number?: string;
}

export interface UpdateCertificateInput {
  certificate_name?: string;
  certificate_type?: CertificateType;
  description?: string;
  issue_date?: string;
  expiration_date?: string;
  issued_by?: string;
  certificate_number?: string;
  status?: CertificateStatus;
}

export interface CertificateVerificationInput {
  verification_status: CertificateVerificationStatus;
  rejection_reason?: string;
}

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  food_safety: 'Food Safety',
  first_aid: 'First Aid',
  license: 'License',
  training: 'Training',
  qualification: 'Qualification',
  other: 'Other'
};

export const CERTIFICATE_STATUS_COLORS: Record<CertificateStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  rejected: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const VERIFICATION_STATUS_COLORS: Record<CertificateVerificationStatus, string> = {
  verified: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};
