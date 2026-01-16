// ============================================================================
// TeamMemberEditDialog - Edit Team Member with PIN Protection
// ============================================================================
// This component allows editing team members with proper authentication:
// - Admin/Manager: Can edit without PIN
// - Staff: Must validate PIN to edit their own profile
// - All edits respect organization isolation
// ============================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PINValidationDialog } from '@/components/auth/PINValidationDialog';
import { useUserRole } from '@/hooks/useUserRole';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import type { TeamMember, TeamMemberRole, UpdateTeamMemberInput } from '@/types/teamMembers';
import { TEAM_MEMBER_ROLE_LABELS } from '@/types/teamMembers';
import { Shield, Lock } from 'lucide-react';

interface TeamMemberEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMember: TeamMember | null;
  currentTeamMemberId?: string; // The team member who is trying to edit (from useCurrentTeamMember)
  onSuccess?: () => void; // Optional callback after successful save
}

export function TeamMemberEditDialog({
  open,
  onOpenChange,
  teamMember,
  currentTeamMemberId,
  onSuccess,
}: TeamMemberEditDialogProps) {
  const { role, canEditWithoutPIN, loading: roleLoading } = useUserRole();
  const { updateTeamMember, loading: updateLoading } = useTeamMembers();

  const [showPinValidation, setShowPinValidation] = useState(false);
  const [pinValidated, setPinValidated] = useState(false);
  const [formData, setFormData] = useState<UpdateTeamMemberInput>({});

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && teamMember) {
      setFormData({
        display_name: teamMember.display_name,
        email: teamMember.email,
        phone: teamMember.phone,
        position: teamMember.position,
        hire_date: teamMember.hire_date,
        role_type: teamMember.role_type,
      });
      setPinValidated(false);
    } else {
      setFormData({});
      setPinValidated(false);
    }
  }, [open, teamMember]);

  if (!teamMember) return null;

  const isEditingSelf = currentTeamMemberId === teamMember.id;
  const requiresPIN = !canEditWithoutPIN && isEditingSelf;

  const handleSaveClick = () => {
    // If requires PIN and not yet validated, show PIN dialog
    if (requiresPIN && !pinValidated) {
      setShowPinValidation(true);
      return;
    }

    // Otherwise, proceed with save
    handleSave();
  };

  const handleSave = async () => {
    if (!teamMember) return;

    const success = await updateTeamMember(teamMember.id, formData);

    if (success) {
      onOpenChange(false);
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const handlePinValidated = () => {
    setPinValidated(true);
    setShowPinValidation(false);
    // Automatically save after PIN validation
    handleSave();
  };

  const handleFieldChange = (field: keyof UpdateTeamMemberInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Edit Team Member</DialogTitle>
              {requiresPIN && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  <Lock className="h-3 w-3" />
                  <span>PIN Required</span>
                </div>
              )}
              {canEditWithoutPIN && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Shield className="h-3 w-3" />
                  <span>Admin Access</span>
                </div>
              )}
            </div>
            <DialogDescription>
              {requiresPIN
                ? 'You will need to enter your PIN to save changes'
                : 'Update team member information'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Full Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name || ''}
                onChange={(e) => handleFieldChange('display_name', e.target.value)}
                placeholder="João Silva"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="joao@restaurant.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => handleFieldChange('position', e.target.value)}
                placeholder="Line Cook"
              />
            </div>

            {/* Hire Date */}
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date || ''}
                onChange={(e) => handleFieldChange('hire_date', e.target.value)}
              />
            </div>

            {/* Role Type (only for admin/manager) */}
            {canEditWithoutPIN && (
              <div className="space-y-2">
                <Label htmlFor="role_type">Role Type</Label>
                <Select
                  value={formData.role_type}
                  onValueChange={(value) => handleFieldChange('role_type', value as TeamMemberRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEAM_MEMBER_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={updateLoading || !formData.display_name}
            >
              {updateLoading ? 'Saving...' : requiresPIN ? 'Save with PIN' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Validation Dialog */}
      {requiresPIN && teamMember.pin_hash && (
        <PINValidationDialog
          open={showPinValidation}
          onOpenChange={setShowPinValidation}
          onValidated={handlePinValidated}
          expectedHash={teamMember.pin_hash}
          title="Verify Your PIN"
          description="Enter your PIN to save changes to your profile"
        />
      )}
    </>
  );
}
