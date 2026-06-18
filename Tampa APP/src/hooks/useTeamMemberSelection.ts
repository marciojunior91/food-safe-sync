// ============================================================================
// useTeamMemberSelection - Persistent Team Member Selection Hook
// ============================================================================
// T1.2: Manages team member selection on Labels page
// - Auto-opens modal if no team member selected
// - Persists selection in localStorage + context
// - Provides selection state and controls
// ============================================================================

import { useState, useEffect } from 'react';
import { TeamMember } from '@/types/teamMembers';

const STORAGE_KEY = 'tampa_selected_team_member';

interface TeamMemberSelection {
  teamMember: TeamMember | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  selectTeamMember: (member: TeamMember) => void;
  clearSelection: () => void;
}

export function useTeamMemberSelection(): TeamMemberSelection {
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTeamMember(parsed);
      } catch (error) {
        console.error('Failed to parse stored team member:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      // No team member selected - open modal automatically (T1.2)
      setIsModalOpen(true);
    }
  }, []);

  const selectTeamMember = (member: TeamMember) => {
    console.log('[useTeamMemberSelection] Selecting team member:', member);
    setTeamMember(member);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    setIsModalOpen(false);
  };

  const clearSelection = () => {
    setTeamMember(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const openModal = () => setIsModalOpen(true);
  // Always allow dismissing the modal. Operational flows (e.g. printing) re-open
  // it on demand when a team member is actually required, so blocking the close
  // here only traps accounts that have no team members yet.
  const closeModal = () => setIsModalOpen(false);

  return {
    teamMember,
    isModalOpen,
    openModal,
    closeModal,
    selectTeamMember,
    clearSelection,
  };
}
