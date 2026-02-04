// ============================================================================
// AddTeamMemberDialog - Create New Team Member
// ============================================================================
// Comprehensive form for adding team members with:
// - Personal information (name, DOB, address, TFN)
// - Contact details (email, phone, emergency contact)
// - Employment information (position, hire date, role)
// - PIN setup for profile access
// - Certificate upload capabilities
// ============================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useUserContext } from '@/hooks/useUserContext';
import type { CreateTeamMemberInput, TeamMemberRole } from '@/types/teamMembers';
import { TEAM_MEMBER_ROLE_LABELS } from '@/types/teamMembers';
import { User, Briefcase, Phone, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPhoneNumber, getRawPhoneNumber, isValidPhoneNumber, formatTFN, getRawTFN } from '@/utils/phoneFormat';
import { DocumentUpload } from './DocumentUpload';

// Local Document interface for upload component
interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
  preview?: string;
}

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddTeamMemberDialogProps) {
  const { toast } = useToast();
  const { context } = useUserContext();
  const { createTeamMember, loading } = useTeamMembers();
  
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'emergency' | 'security' | 'documents'>('personal');
  const [formData, setFormData] = useState<CreateTeamMemberInput>({
    display_name: '',
    role_type: 'cook',
    organization_id: context?.organization_id || '',
  });
  
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        display_name: '',
        role_type: 'cook',
        organization_id: context?.organization_id || '',
      });
      setPin('');
      setPinConfirm('');
      setDocuments([]);
      setErrors({});
      setActiveTab('personal');
    }
  }, [open, context?.organization_id]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.display_name?.trim()) {
      newErrors.display_name = 'Full name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Invalid phone format (10-15 digits)';
    }

    if (!formData.position?.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!formData.hire_date) {
      newErrors.hire_date = 'Hire date is required';
    }

    // PIN validation
    if (!pin) {
      newErrors.pin = '4-digit PIN is required';
    } else if (!/^\d{4}$/.test(pin)) {
      newErrors.pin = 'PIN must be exactly 4 digits';
    } else if (pin !== pinConfirm) {
      newErrors.pinConfirm = 'PINs do not match';
    }

    // Optional but validated if provided
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 14 || age > 100) {
        newErrors.date_of_birth = 'Age must be between 14 and 100 years';
      }
    }

    if (formData.emergency_contact_phone && !isValidPhoneNumber(formData.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = 'Invalid phone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    const success = await createTeamMember({
      ...formData,
      phone: formData.phone ? getRawPhoneNumber(formData.phone) : undefined,
      emergency_contact_phone: formData.emergency_contact_phone ? getRawPhoneNumber(formData.emergency_contact_phone) : undefined,
      tfn_number: formData.tfn_number ? getRawTFN(formData.tfn_number) : undefined,
      pin, // Will be hashed by the hook
    });

    if (success) {
      toast({
        title: 'Team Member Added',
        description: `${formData.display_name} has been added to your team.`,
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } else {
      toast({
        title: 'Error',
        description: 'Failed to add team member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFieldChange = (field: keyof CreateTeamMemberInput, value: any) => {
    // Format phone fields as user types
    if (field === 'phone' || field === 'emergency_contact_phone') {
      setFormData(prev => ({ ...prev, [field]: formatPhoneNumber(value) }));
    } else if (field === 'tfn_number') {
      // Format TFN as user types
      setFormData(prev => ({ ...prev, [field]: formatTFN(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Add New Team Member
            </DialogTitle>
            <DialogDescription>
              Add a new team member to your organization. All required fields must be completed.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Employment</span>
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Emergency</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            {/* PERSONAL INFORMATION TAB */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                  <CardDescription>Basic personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display_name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="display_name"
                      placeholder="John Smith"
                      value={formData.display_name || ''}
                      onChange={(e) => handleFieldChange('display_name', e.target.value)}
                      className={errors.display_name ? 'border-destructive' : ''}
                    />
                    {errors.display_name && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.display_name}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      Date of Birth <span className="text-muted-foreground">(Recommended)</span>
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      className={errors.date_of_birth ? 'border-destructive' : ''}
                      min="1950-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      placeholder="DD/MM/YYYY"
                    />
                    {errors.date_of_birth && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.date_of_birth}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Click on the year to select from dropdown (1950-2026)
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.smith@example.com"
                      value={formData.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Address <span className="text-muted-foreground">(Recommended)</span>
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="123 Main St, City, State, ZIP"
                      value={formData.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* TFN */}
                  <div className="space-y-2">
                    <Label htmlFor="tfn_number">
                      TFN (Tax File Number) <span className="text-muted-foreground">(Recommended)</span>
                    </Label>
                    <Input
                      id="tfn_number"
                      placeholder="123 456 789"
                      value={formData.tfn_number || ''}
                      onChange={(e) => handleFieldChange('tfn_number', e.target.value)}
                      maxLength={11}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: nnn nnn nnn (8 or 9 digits)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EMPLOYMENT INFORMATION TAB */}
            <TabsContent value="employment" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Employment Details</CardTitle>
                  <CardDescription>Position, role, and hire information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Position */}
                  <div className="space-y-2">
                    <Label htmlFor="position">
                      Position / Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="position"
                      placeholder="e.g., Head Chef, Pastry Cook, Barista"
                      value={formData.position || ''}
                      onChange={(e) => handleFieldChange('position', e.target.value)}
                      className={errors.position ? 'border-destructive' : ''}
                    />
                    {errors.position && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.position}
                      </p>
                    )}
                  </div>

                  {/* Role Type */}
                  <div className="space-y-2">
                    <Label htmlFor="role_type">
                      Role Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.role_type}
                      onValueChange={(value: TeamMemberRole) => handleFieldChange('role_type', value)}
                    >
                      <SelectTrigger id="role_type">
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
                    <p className="text-xs text-muted-foreground">
                      Role determines access level and responsibilities
                    </p>
                  </div>

                  {/* Hire Date */}
                  {/* Hire Date */}
                  <div className="space-y-2">
                    <Label htmlFor="hire_date">
                      Hire Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date || ''}
                      onChange={(e) => handleFieldChange('hire_date', e.target.value)}
                      className={errors.hire_date ? 'border-destructive' : ''}
                      min="2000-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      placeholder="DD/MM/YYYY"
                    />
                    {errors.hire_date && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.hire_date}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Click on the year to select from dropdown (2000-2026)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EMERGENCY CONTACT TAB */}
            <TabsContent value="emergency" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Emergency Contact</CardTitle>
                  <CardDescription>Contact information for emergencies (Recommended)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Emergency Contact Name */}
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      placeholder="Jane Smith"
                      value={formData.emergency_contact_name || ''}
                      onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.emergency_contact_phone || ''}
                      onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                      className={errors.emergency_contact_phone ? 'border-destructive' : ''}
                    />
                    {errors.emergency_contact_phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.emergency_contact_phone}
                      </p>
                    )}
                  </div>

                  {/* Relationship */}
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                    <Select
                      value={formData.emergency_contact_relationship || ''}
                      onValueChange={(value) => handleFieldChange('emergency_contact_relationship', value)}
                    >
                      <SelectTrigger id="emergency_contact_relationship">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DOCUMENTS TAB */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Certificates & Documents
                  </CardTitle>
                  <CardDescription>
                    Upload certificates, TFN, and other important documents (PDF, JPG, PNG, WEBP)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentUpload
                    teamMemberId={undefined}
                    documents={documents}
                    onDocumentsChange={setDocuments}
                    maxFiles={10}
                    maxSizeInMB={10}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECURITY TAB */}
            <TabsContent value="security" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    PIN Setup
                  </CardTitle>
                  <CardDescription>
                    4-digit PIN for profile access and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* PIN */}
                  <div className="space-y-2">
                    <Label htmlFor="pin">
                      4-Digit PIN <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPin(value);
                        if (errors.pin) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.pin;
                            return newErrors;
                          });
                        }
                      }}
                      className={errors.pin ? 'border-destructive' : ''}
                    />
                    {errors.pin && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.pin}
                      </p>
                    )}
                  </div>

                  {/* PIN Confirm */}
                  <div className="space-y-2">
                    <Label htmlFor="pinConfirm">
                      Confirm PIN <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pinConfirm"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={pinConfirm}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPinConfirm(value);
                        if (errors.pinConfirm) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.pinConfirm;
                            return newErrors;
                          });
                        }
                      }}
                      className={errors.pinConfirm ? 'border-destructive' : ''}
                    />
                    {errors.pinConfirm && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.pinConfirm}
                      </p>
                    )}
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> This PIN will be used by the team member to:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                      <li>Access their profile and feed notifications</li>
                      <li>Edit their personal information</li>
                      <li>Print labels and perform daily tasks</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
