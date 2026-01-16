// ============================================================================
// People / User Management Types
// ============================================================================

export type UserRole = 
  | 'admin'
  | 'manager'
  | 'leader_chef'
  | 'staff';

export type EmploymentStatus = 
  | 'active'
  | 'on_leave'
  | 'terminated';

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface UserProfile {
  user_id: string;
  organization_id: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  role: UserRole;
  position?: string;
  phone?: string;
  department_id?: string;
  hire_date?: string; // This is the actual field name in database
  location_id?: string;
  created_at: string;
  updated_at: string;
  user_documents?: UserDocument[];
}

export interface UserPin {
  id: string;
  user_id: string;
  pin_hash: string;
  failed_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
}

export type DocumentStatus = 
  | 'active'
  | 'expired'
  | 'pending_renewal'
  | 'rejected';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  issue_date?: string;
  expiration_date?: string;
  issuing_organization?: string;
  status: DocumentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Form data types
export interface CreateUserInput {
  user_id: string;
  display_name: string;
  email?: string;
  role: UserRole;
  position?: string;
  date_of_birth?: string;
  phone?: string;
  address?: UserAddress;
  admission_date?: string;
  tfn_number?: string;
  pin?: string; // 4-digit PIN
  employment_status?: EmploymentStatus;
}

export interface UpdateUserInput {
  display_name?: string;
  position?: string;
  date_of_birth?: string;
  phone?: string;
  address?: UserAddress;
  admission_date?: string;
  tfn_number?: string;
  employment_status?: EmploymentStatus;
  email?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UserFilters {
  role?: UserRole | 'all';
  employment_status?: EmploymentStatus;
  department_id?: string;
  search?: string;
  active_only?: boolean;
}

export interface UploadDocumentInput {
  document_type: string;
  document_name: string;
  file: File;
  issue_date?: string;
  expiration_date?: string;
  issuing_organization?: string;
  notes?: string;
}

// Helper constants
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  leader_chef: 'Leader Chef',
  staff: 'Staff'
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  on_leave: 'On Leave',
  terminated: 'Terminated'
};

export const calculateProfileCompletion = (profile: Partial<UserProfile>): number => {
  const fields = [
    'display_name',
    'email',
    'phone',
    'avatar_url',
    'bio',
    'role',
    'department_id'
  ];

  const completed = fields.filter(field => {
    const value = profile[field as keyof UserProfile];
    return value !== null && value !== undefined && value !== '';
  }).length;

  return Math.round((completed / fields.length) * 100);
};
