// Organization and Department Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: Record<string, any>;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  timezone: string;
  settings: Record<string, any>;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial';
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserContext {
  user_id: string;
  organization_id: string;
  organization_name: string;
  department_id: string;
  department_name: string;
  user_role: string;
  display_name: string;
}

// Helper function to get organization name from context
export function getOrganizationName(context: UserContext | null): string {
  return context?.organization_name || 'Unknown Organization';
}

// Helper function to get department name from context
export function getDepartmentName(context: UserContext | null): string {
  return context?.department_name || 'No Department';
}

// Helper function to check if user belongs to organization
export function isInOrganization(context: UserContext | null, organizationId: string): boolean {
  return context?.organization_id === organizationId;
}

// Helper function to check if user belongs to department
export function isInDepartment(context: UserContext | null, departmentId: string): boolean {
  return context?.department_id === departmentId;
}
