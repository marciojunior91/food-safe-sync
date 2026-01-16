// ============================================================================
// PIN Security Utilities
// ============================================================================
// Utilities for interacting with PIN security features:
// - Lockout checking
// - Verification logging
// - Manager unlock
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a team member is currently locked out
 */
export async function isTeamMemberLockedOut(teamMemberId: string): Promise<{
  isLocked: boolean;
  lockoutUntil: string | null;
  failedAttempts: number;
}> {
  try {
    const { data, error } = await supabase.rpc('is_team_member_locked_out', {
      _team_member_id: teamMemberId,
    });

    if (error) throw error;

    // Also get the team member's lockout details
    const { data: teamMember, error: tmError } = await supabase
      .from('team_members')
      .select('is_locked_out, lockout_until, failed_pin_attempts')
      .eq('id', teamMemberId)
      .single();

    if (tmError) throw tmError;

    return {
      isLocked: data || false,
      lockoutUntil: teamMember?.lockout_until || null,
      failedAttempts: teamMember?.failed_pin_attempts || 0,
    };
  } catch (error) {
    console.error('[pinSecurity] Error checking lockout status:', error);
    return { isLocked: false, lockoutUntil: null, failedAttempts: 0 };
  }
}

/**
 * Log a PIN verification attempt
 */
export async function logPINVerification(
  teamMemberId: string,
  status: 'success' | 'failed',
  ipAddress?: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_pin_verification', {
      _team_member_id: teamMemberId,
      _verification_status: status,
      _ip_address: ipAddress || null,
      _user_agent: navigator.userAgent,
    });

    if (error) throw error;
  } catch (error) {
    console.error('[pinSecurity] Error logging PIN verification:', error);
    // Don't throw - logging failure shouldn't block authentication
  }
}

/**
 * Unlock a team member (manager/admin only)
 */
export async function unlockTeamMember(
  teamMemberId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('unlock_team_member', {
      _team_member_id: teamMemberId,
      _manager_notes: notes || null,
    });

    if (error) throw error;

    return { success: data || true };
  } catch (error: any) {
    console.error('[pinSecurity] Error unlocking team member:', error);
    return {
      success: false,
      error: error.message || 'Failed to unlock team member',
    };
  }
}

/**
 * Get recent failed attempts for a team member
 */
export async function getRecentFailedAttempts(
  teamMemberId: string,
  hoursBack: number = 24
): Promise<Array<{
  attempted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}>> {
  try {
    const { data, error } = await supabase.rpc('get_recent_failed_attempts', {
      _team_member_id: teamMemberId,
      _hours_back: hoursBack,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('[pinSecurity] Error fetching failed attempts:', error);
    return [];
  }
}

/**
 * Get all locked out team members in an organization
 */
export async function getLockedOutTeamMembers(
  organizationId: string
): Promise<Array<{
  team_member_id: string;
  display_name: string;
  position: string | null;
  failed_attempts: number;
  last_failed_attempt: string | null;
  lockout_until: string | null;
  is_permanent_lockout: boolean;
}>> {
  try {
    const { data, error } = await supabase.rpc('get_locked_out_team_members', {
      _organization_id: organizationId,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('[pinSecurity] Error fetching locked out team members:', error);
    return [];
  }
}

/**
 * Get PIN security dashboard data for an organization
 */
export async function getPINSecurityDashboard(
  organizationId: string
): Promise<Array<{
  team_member_id: string;
  display_name: string;
  position: string | null;
  role_type: string;
  is_locked_out: boolean;
  lockout_until: string | null;
  failed_pin_attempts: number;
  last_failed_attempt: string | null;
  attempts_last_24h: number;
  failed_attempts_last_24h: number;
  last_successful_login: string | null;
}>> {
  try {
    const { data, error } = await supabase
      .from('pin_security_dashboard')
      .select('*')
      .eq('organization_id', organizationId)
      .order('failed_attempts_last_24h', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('[pinSecurity] Error fetching security dashboard:', error);
    return [];
  }
}

/**
 * Format lockout time remaining
 */
export function formatLockoutTimeRemaining(lockoutUntil: string | null): string {
  if (!lockoutUntil) return 'Permanently locked';

  const until = new Date(lockoutUntil);
  const now = new Date();
  const diffMs = until.getTime() - now.getTime();

  if (diffMs <= 0) return 'Lockout expired';

  const diffMinutes = Math.ceil(diffMs / 1000 / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);
  return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
}

/**
 * Get user's IP address (best effort)
 */
export async function getUserIPAddress(): Promise<string | null> {
  try {
    // Try to get IP from ipify API
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn('[pinSecurity] Could not fetch IP address:', error);
    return null;
  }
}
