// Step 4: Team Members Registration
// Iteration 13 - MVP Sprint

import { useState } from "react";
import { Plus, X, User, FileText, AlertCircle, Eye, EyeOff } from "lucide-react";
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
import { TeamMembersData, TeamMemberEntry } from "@/types/onboarding";
import { validateTeamMembers, validatePIN } from "@/utils/onboardingValidation";
import { useToast } from "@/hooks/use-toast";

interface TeamMembersStepProps {
  data: Partial<TeamMembersData>;
  onChange: (data: Partial<TeamMembersData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TEAM_MEMBER_ROLES = [
  { value: 'cook', label: 'Cook', icon: '👨‍🍳' },
  { value: 'barista', label: 'Barista', icon: '☕' },
  { value: 'chef', label: 'Chef', icon: '🔪' },
  { value: 'cleaner', label: 'Cleaner', icon: '🧹' },
  { value: 'server', label: 'Server', icon: '🍽️' },
  { value: 'other', label: 'Other', icon: '👤' },
];

export default function TeamMembersStep({ data, onChange, onNext, onBack }: TeamMembersStepProps) {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPins, setShowPins] = useState<Record<number, boolean>>({});
  const [newMember, setNewMember] = useState<Partial<TeamMemberEntry>>({});

  // Generate random PIN
  const generatePIN = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewMember({ ...newMember, pin });
  };

  // Check if PIN is unique
  const isPinUnique = (pin: string, excludeIndex?: number): boolean => {
    return !(data.teamMembers || []).some((member, index) => 
      member.pin === pin && index !== excludeIndex
    );
  };

  // Add team member
  const handleAddMember = () => {
    // Validate
    if (!newMember.displayName || !newMember.role || !newMember.pin) {
      toast({
        title: "Validation Error",
        description: "Name, role, and PIN are required",
        variant: "destructive",
      });
      return;
    }

    if (!validatePIN(newMember.pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4-6 digits",
        variant: "destructive",
      });
      return;
    }

    if (!isPinUnique(newMember.pin)) {
      toast({
        title: "Duplicate PIN",
        description: "This PIN is already in use. Please choose another.",
        variant: "destructive",
      });
      return;
    }

    const teamMembers = [...(data.teamMembers || []), newMember as TeamMemberEntry];
    onChange({ ...data, teamMembers, skipForNow: false });
    
    // Reset form
    setNewMember({});
    setShowAddForm(false);
    
    toast({
      title: "Team Member Added",
      description: `${newMember.displayName} has been added`,
    });
  };

  // Remove team member
  const handleRemoveMember = (index: number) => {
    const teamMembers = [...(data.teamMembers || [])];
    teamMembers.splice(index, 1);
    onChange({ ...data, teamMembers });
  };

  // Toggle PIN visibility
  const togglePinVisibility = (index: number) => {
    setShowPins({ ...showPins, [index]: !showPins[index] });
  };

  // Handle next
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow skipping if no team members
    if (!data.teamMembers || data.teamMembers.length === 0) {
      onChange({ ...data, skipForNow: true });
      onNext();
      return;
    }

    const validation = validateTeamMembers(data.teamMembers);
    
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

  const getRoleIcon = (role: string) => {
    return TEAM_MEMBER_ROLES.find(r => r.value === role)?.icon || '👤';
  };

  const getRoleLabel = (role: string) => {
    return TEAM_MEMBER_ROLES.find(r => r.value === role)?.label || role;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Add your operational staff who will use PIN authentication for daily tasks. 
          These team members can log in using their PIN on shared devices.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Team Members</h3>
        {!showAddForm && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      {/* Add Team Member Form */}
      {showAddForm && (
        <Card className="border-primary/50">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input
                  value={newMember.displayName || ''}
                  onChange={(e) => setNewMember({ ...newMember, displayName: e.target.value })}
                  placeholder="e.g., John Smith"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={newMember.role || ''}
                  onValueChange={(value: any) => setNewMember({ ...newMember, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_MEMBER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <span className="flex items-center gap-2">
                          <span>{role.icon}</span>
                          <span>{role.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <Label>PIN (4-6 digits) *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={newMember.pin || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNewMember({ ...newMember, pin: value });
                    }}
                    placeholder="Enter 4-6 digit PIN"
                    className="pr-10"
                  />
                </div>
                <Button type="button" variant="outline" onClick={generatePIN}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This PIN will be used for quick login on shared devices
              </p>
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={newMember.email || ''}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="john.smith@example.com"
              />
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <Input
                type="tel"
                value={newMember.phone || ''}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                placeholder="04XX XXX XXX"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={newMember.notes || ''}
                onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                placeholder="Additional information..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleAddMember}>
                Add Team Member
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setNewMember({});
                setShowAddForm(false);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <div className="space-y-2">
        {(data.teamMembers || []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No team members added yet</p>
              <p className="text-sm text-muted-foreground">
                Add your staff members or skip this step to add them later
              </p>
            </CardContent>
          </Card>
        ) : (
          (data.teamMembers || []).map((member, index) => (
            <Card key={index}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getRoleIcon(member.role)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{member.displayName}</h4>
                        <Badge variant="secondary">{getRoleLabel(member.role)}</Badge>
                      </div>
                      
                      {/* PIN Display */}
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs text-muted-foreground">PIN:</Label>
                        <div className="flex items-center gap-1">
                          <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                            {showPins[index] ? member.pin : '••••••'.slice(0, member.pin.length)}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => togglePinVisibility(index)}
                          >
                            {showPins[index] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Contact Info */}
                      {(member.email || member.phone) && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          {member.email && <p>📧 {member.email}</p>}
                          {member.phone && <p>📱 {member.phone}</p>}
                        </div>
                      )}

                      {/* Notes */}
                      {member.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {member.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {(data.teamMembers || []).length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>{(data.teamMembers || []).length}</strong> team member(s) ready to be added
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
          Continue
        </Button>
      </div>
    </form>
  );
}
