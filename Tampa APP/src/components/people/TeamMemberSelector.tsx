import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import PINInput from '@/components/people/PINInput';
import type { TeamMember } from '@/types/teamMembers';
import { TEAM_MEMBER_ROLE_LABELS, TEAM_MEMBER_ROLE_COLORS } from '@/types/teamMembers';

interface TeamMemberSelectorProps {
  authRoleId: string;
  organizationId: string;
  onSelect: (teamMember: TeamMember) => void;
  onCancel?: () => void;
}

export const TeamMemberSelector = ({
  authRoleId,
  organizationId,
  onSelect,
  onCancel,
}: TeamMemberSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showPINDialog, setShowPINDialog] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);

  const { 
    teamMembers, 
    loading, 
    error, 
    fetchTeamMembers,
    verifyPIN 
  } = useTeamMembers();

  // Load team members for this auth role
  useEffect(() => {
    fetchTeamMembers({ 
      auth_role_id: authRoleId, 
      organization_id: organizationId,
      is_active: true 
    });
  }, [authRoleId, organizationId]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(teamMembers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        teamMembers.filter(
          (member) =>
            member.display_name.toLowerCase().includes(query) ||
            member.email?.toLowerCase().includes(query) ||
            member.position?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, teamMembers]);

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowPINDialog(true);
  };

  const handlePINSubmit = async (pin: string): Promise<boolean> => {
    if (!selectedMember) return false;

    // Verify PIN
    const isValid = await verifyPIN(selectedMember.id, pin);
    if (isValid) {
      onSelect(selectedMember);
      return true;
    }
    return false;
  };

  const handlePINCancel = () => {
    setShowPINDialog(false);
    setSelectedMember(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileCompletionIcon = (member: TeamMember) => {
    if (member.profile_complete) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading team members...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
            {onCancel && (
              <Button onClick={onCancel} variant="outline" className="mt-4 w-full">
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl">Who are you?</CardTitle>
            <CardDescription>
              Select your profile to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Team Members Grid */}
            {filteredMembers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {searchQuery
                    ? 'No team members found matching your search.'
                    : 'No team members found. Please contact your administrator.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => handleSelectMember(member)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(member.display_name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">
                              {member.display_name}
                            </h3>
                            {getProfileCompletionIcon(member)}
                          </div>

                          {member.position && (
                            <p className="text-sm text-muted-foreground">
                              {member.position}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: TEAM_MEMBER_ROLE_COLORS[member.role_type] + '20',
                                color: TEAM_MEMBER_ROLE_COLORS[member.role_type],
                              }}
                            >
                              {TEAM_MEMBER_ROLE_LABELS[member.role_type]}
                            </Badge>

                            {!member.profile_complete && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                Incomplete
                              </Badge>
                            )}
                          </div>

                          {member.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </p>
                          )}
                        </div>

                        {/* Arrow indicator */}
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Cancel button */}
            {onCancel && (
              <div className="pt-4 border-t">
                <Button onClick={onCancel} variant="outline" className="w-full">
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PIN Dialog */}
      {showPINDialog && selectedMember && (
        <PINInput
          open={showPINDialog}
          onOpenChange={setShowPINDialog}
          onSubmit={handlePINSubmit}
          title={`Welcome, ${selectedMember.display_name}!`}
          description="Please enter your 4-digit PIN to continue"
          teamMemberName={selectedMember.display_name}
        />
      )}
    </>
  );
};
