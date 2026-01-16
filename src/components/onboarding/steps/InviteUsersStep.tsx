// Step 5: Invite Auth Users
// Iteration 13 - MVP Sprint

import { useState } from "react";
import { Plus, X, Mail, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { InviteUsersData, UserInvitation } from "@/types/onboarding";
import { validateInvitations, validateEmail } from "@/utils/onboardingValidation";
import { useToast } from "@/hooks/use-toast";

interface InviteUsersStepProps {
  data: Partial<InviteUsersData>;
  onChange: (data: Partial<InviteUsersData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const AUTH_USER_ROLES = [
  { 
    value: 'admin', 
    label: 'Admin', 
    icon: '👑',
    description: 'Full access to all features and settings'
  },
  { 
    value: 'manager', 
    label: 'Manager', 
    icon: '📊',
    description: 'Manage operations, view reports, manage team'
  },
  { 
    value: 'leader_chef', 
    label: 'Leader Chef', 
    icon: '👨‍🍳',
    description: 'Manage recipes, tasks, and kitchen operations'
  },
];

export default function InviteUsersStep({ data, onChange, onNext, onBack }: InviteUsersStepProps) {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInvitation, setNewInvitation] = useState<Partial<UserInvitation>>({});

  // Check if email is unique
  const isEmailUnique = (email: string, excludeIndex?: number): boolean => {
    return !(data.invitations || []).some((invitation, index) => 
      invitation.email.toLowerCase() === email.toLowerCase() && index !== excludeIndex
    );
  };

  // Add invitation
  const handleAddInvitation = () => {
    // Validate
    if (!newInvitation.email || !newInvitation.role) {
      toast({
        title: "Validation Error",
        description: "Email and role are required",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(newInvitation.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!isEmailUnique(newInvitation.email)) {
      toast({
        title: "Duplicate Email",
        description: "This email has already been added",
        variant: "destructive",
      });
      return;
    }

    const invitations = [...(data.invitations || []), newInvitation as UserInvitation];
    onChange({ ...data, invitations, skipForNow: false });
    
    // Reset form
    setNewInvitation({});
    setShowAddForm(false);
    
    toast({
      title: "Invitation Added",
      description: `Invitation for ${newInvitation.email} has been added`,
    });
  };

  // Remove invitation
  const handleRemoveInvitation = (index: number) => {
    const invitations = [...(data.invitations || [])];
    invitations.splice(index, 1);
    onChange({ ...data, invitations });
  };

  // Handle next
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow skipping if no invitations
    if (!data.invitations || data.invitations.length === 0) {
      onChange({ ...data, skipForNow: true });
      onNext();
      return;
    }

    const validation = validateInvitations(data.invitations);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing",
        variant: "destructive",
      });
      return;
    }
    
    onNext();
  };

  const getRoleInfo = (role: string) => {
    return AUTH_USER_ROLES.find(r => r.value === role);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invite managers and administrators to your organization. They will receive an email 
          with instructions to create their account and set their password.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">User Invitations</h3>
        {!showAddForm && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Invitation
          </Button>
        )}
      </div>

      {/* Add Invitation Form */}
      {showAddForm && (
        <Card className="border-primary/50">
          <CardContent className="pt-6 space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={newInvitation.email || ''}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  placeholder="manager@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={newInvitation.role || ''}
                onValueChange={(value: any) => setNewInvitation({ ...newInvitation, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_USER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{role.icon}</span>
                          <span className="font-medium">{role.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Role description */}
              {newInvitation.role && (
                <p className="text-sm text-muted-foreground">
                  {getRoleInfo(newInvitation.role)?.description}
                </p>
              )}
            </div>

            {/* Personal Message */}
            <div className="space-y-2">
              <Label>Personal Message (Optional)</Label>
              <Textarea
                value={newInvitation.personalMessage || ''}
                onChange={(e) => setNewInvitation({ ...newInvitation, personalMessage: e.target.value })}
                placeholder="Add a personal message to the invitation email..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleAddInvitation}>
                Add Invitation
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setNewInvitation({});
                setShowAddForm(false);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invitations List */}
      <div className="space-y-2">
        {(data.invitations || []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No invitations added yet</p>
              <p className="text-sm text-muted-foreground">
                Invite managers and admins to collaborate, or skip to add them later
              </p>
            </CardContent>
          </Card>
        ) : (
          (data.invitations || []).map((invitation, index) => {
            const roleInfo = getRoleInfo(invitation.role);
            
            return (
              <Card key={index}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">{roleInfo?.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{invitation.email}</span>
                          <Badge variant="secondary">{roleInfo?.label}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {roleInfo?.description}
                        </p>

                        {/* Personal Message */}
                        {invitation.personalMessage && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">Personal message:</p>
                            <p className="text-sm italic">{invitation.personalMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveInvitation(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Role Information Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2">About User Roles</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {AUTH_USER_ROLES.map((role) => (
                  <li key={role.value} className="flex items-start gap-2">
                    <span>{role.icon}</span>
                    <div>
                      <span className="font-medium text-foreground">{role.label}:</span>{' '}
                      {role.description}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {(data.invitations || []).length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>{(data.invitations || []).length}</strong> invitation(s) will be sent once you complete setup
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {Object.values(errors).map((error, i) => (
                <li key={i} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={onNext} className="flex-1">
          Skip for Now
        </Button>
        <Button type="submit" className="flex-1" size="lg">
          Complete Setup
        </Button>
      </div>
    </form>
  );
}
