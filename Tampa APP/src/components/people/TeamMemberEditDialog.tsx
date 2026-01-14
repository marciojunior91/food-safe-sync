// ============================================================================
// TeamMemberEditDialog - Edit Team Member with PIN Protection
// ============================================================================
// This component allows editing team members with proper authentication:
// - Admin/Manager: Can edit without PIN
// - Staff: Must validate PIN to edit their own profile
// - All edits respect organization isolation
// ============================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PINValidationDialog } from '@/components/auth/PINValidationDialog';
import { useUserRole } from '@/hooks/useUserRole';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import type { TeamMember, TeamMemberRole, UpdateTeamMemberInput } from '@/types/teamMembers';
import { TEAM_MEMBER_ROLE_LABELS } from '@/types/teamMembers';
import { Shield, Lock, User, Briefcase, Phone as PhoneIcon, Heart, FileText } from 'lucide-react';
import { formatPhoneNumber, getRawPhoneNumber, formatTFN, getRawTFN } from '@/utils/phoneFormat';
import { DocumentUpload } from './DocumentUpload';

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
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'emergency' | 'documents'>('personal');
  const [documents, setDocuments] = useState<any[]>([]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && teamMember) {
      setFormData({
        display_name: teamMember.display_name,
        email: teamMember.email,
        phone: teamMember.phone ? formatPhoneNumber(teamMember.phone) : teamMember.phone,
        position: teamMember.position,
        date_of_birth: teamMember.date_of_birth,
        address: teamMember.address,
        tfn_number: teamMember.tfn_number ? formatTFN(teamMember.tfn_number) : teamMember.tfn_number,
        emergency_contact_name: teamMember.emergency_contact_name,
        emergency_contact_phone: teamMember.emergency_contact_phone ? formatPhoneNumber(teamMember.emergency_contact_phone) : teamMember.emergency_contact_phone,
        emergency_contact_relationship: teamMember.emergency_contact_relationship,
        hire_date: teamMember.hire_date,
        role_type: teamMember.role_type,
        is_active: teamMember.is_active,
      });
      setPinValidated(false);
      setActiveTab('personal');
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

    // Remove phone and TFN formatting before saving
    const dataToSave = {
      ...formData,
      phone: formData.phone ? getRawPhoneNumber(formData.phone) : formData.phone,
      emergency_contact_phone: formData.emergency_contact_phone ? getRawPhoneNumber(formData.emergency_contact_phone) : formData.emergency_contact_phone,
      tfn_number: formData.tfn_number ? getRawTFN(formData.tfn_number) : formData.tfn_number,
    };

    const success = await updateTeamMember(teamMember.id, dataToSave);

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
    // Format phone fields as user types
    if (field === 'phone' || field === 'emergency_contact_phone') {
      setFormData(prev => ({ ...prev, [field]: formatPhoneNumber(value) }));
    } else if (field === 'tfn_number') {
      // Format TFN as user types
      setFormData(prev => ({ ...prev, [field]: formatTFN(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
            
            {/* Active Status Toggle (Admin only) - Moved below title */}
            {canEditWithoutPIN && (
              <div className="flex items-center gap-2 pt-2">
                <Label htmlFor="is_active" className="text-sm cursor-pointer">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
                />
              </div>
            )}
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Employment</span>
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Emergency</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4 py-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="display_name"
                  value={formData.display_name || ''}
                  onChange={(e) => handleFieldChange('display_name', e.target.value)}
                  placeholder="João Silva"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
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
                  placeholder="(123) 456-7890"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="123 Main Street, City, State, ZIP"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Employment Information Tab */}
            <TabsContent value="employment" className="space-y-4 py-4">
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
            </TabsContent>

            {/* Emergency Contact Tab */}
            <TabsContent value="emergency" className="space-y-4 py-4">
              {/* Emergency Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name || ''}
                  onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                  placeholder="Maria Silva"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone || ''}
                  onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                  placeholder="(123) 456-7890"
                />
              </div>

              {/* Emergency Contact Relationship */}
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Input
                  id="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship || ''}
                  onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
                  placeholder="Spouse, Parent, Sibling, etc."
                />
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 py-4">
              {/* TFN Number (Tax File Number) */}
              <div className="space-y-2">
                <Label htmlFor="tfn_number">TFN (Tax File Number)</Label>
                <Input
                  id="tfn_number"
                  value={formData.tfn_number || ''}
                  onChange={(e) => handleFieldChange('tfn_number', e.target.value)}
                  placeholder="123 456 789"
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">
                  Format: nnn nnn nnn (8 or 9 digits)
                </p>
              </div>

              {/* Document Upload Component */}
              <div className="space-y-2">
                <Label>Certificates & Documents</Label>
                <DocumentUpload
                  teamMemberId={teamMember?.id}
                  documents={documents}
                  onDocumentsChange={setDocuments}
                  maxFiles={10}
                  maxSizeInMB={10}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
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
          </DialogFooter>
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
