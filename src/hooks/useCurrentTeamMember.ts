// ============================================================================
// useCurrentTeamMember Hook - Manages Tablet Session
// ============================================================================
// This hook manages the current team member session on shared tablets
// - Stores selection in localStorage for persistence
// - Provides easy access to current team member context
// - Used by all operational modules (labeling, routine tasks, etc)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { TeamMember } from '@/types/teamMembers';

const STORAGE_KEY = 'tampa_current_team_member';

interface UseCurrentTeamMemberReturn {
  currentMember: TeamMember | null;
  selectTeamMember: (member: TeamMember) => void;
  clearTeamMember: () => void;
  isTeamMemberSelected: boolean;
  requiresTeamMemberSelection: boolean;
}

/**
 * Hook to manage the current team member session on shared tablets
 * 
 * Usage:
 * ```tsx
 * const { currentMember, selectTeamMember, clearTeamMember } = useCurrentTeamMember();
 * 
 * // Show selection dialog if no member selected
 * if (!currentMember) {
 *   return <UserSelectionDialog onSelect={selectTeamMember} />;
 * }
 * 
 * // Use current member in operations
 * createLabel({ prepared_by: currentMember.id });
 * ```
 */
export const useCurrentTeamMember = (): UseCurrentTeamMemberReturn => {
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentMember(parsed);
        console.log('Loaded team member from session:', parsed.display_name);
      }
    } catch (error) {
      console.error('Error loading team member from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Select team member and persist to localStorage
  const selectTeamMember = useCallback((member: TeamMember) => {
    try {
      setCurrentMember(member);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
      console.log('Team member selected:', member.display_name);
    } catch (error) {
      console.error('Error saving team member to localStorage:', error);
    }
  }, []);

  // Clear team member from session
  const clearTeamMember = useCallback(() => {
    setCurrentMember(null);
    localStorage.removeItem(STORAGE_KEY);
    console.log('Team member session cleared');
  }, []);

  // Derived state
  const isTeamMemberSelected = currentMember !== null;
  const requiresTeamMemberSelection = currentMember === null;

  return {
    currentMember,
    selectTeamMember,
    clearTeamMember,
    isTeamMemberSelected,
    requiresTeamMemberSelection,
  };
};

/**
 * Utility function to get current team member from localStorage
 * Useful for one-off reads without using the hook
 */
export const getCurrentTeamMemberSync = (): TeamMember | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading team member from localStorage:', error);
  }
  return null;
};

/**
 * Utility function to check if a team member is currently selected
 */
export const hasTeamMemberSelected = (): boolean => {
  return getCurrentTeamMemberSync() !== null;
};
