// ============================================================================
// IncompleteProfilesAlert - Manager/Admin Alert for Incomplete Profiles
// ============================================================================
// Displays a collapsible card showing team members with incomplete profiles.
// Only visible to managers and admins.
// Helps managers track and follow up on profile completion.
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember } from '@/types/teamMembers';
import { TEAM_MEMBER_ROLE_LABELS, TEAM_MEMBER_ROLE_COLORS } from '@/types/teamMembers';

interface IncompleteProfilesAlertProps {
  organizationId: string;
  userRole?: string;
}

export function IncompleteProfilesAlert({ 
  organizationId, 
  userRole 
}: IncompleteProfilesAlertProps) {
  const [incompleteMembers, setIncompleteMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Only show for admins, managers, owners
  const isAuthorized = ['admin', 'manager', 'owner'].includes(userRole || '');

  useEffect(() => {
    if (isAuthorized && organizationId) {
      fetchIncompleteProfiles();
    }
  }, [organizationId, isAuthorized]);

  const fetchIncompleteProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('profile_complete', false) // Only incomplete profiles
        .order('display_name', { ascending: true });

      if (error) throw error;

      setIncompleteMembers(data || []);
    } catch (error) {
      console.error('[IncompleteProfilesAlert] Error fetching incomplete profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not authorized or no incomplete profiles
  if (!isAuthorized || incompleteMembers.length === 0) {
    return null;
  }

  const getCompletionPercentage = (member: TeamMember) => {
    // Calculate based on filled fields
    const fields = [
      member.display_name,
      member.email,
      member.phone,
      member.position,
      member.hire_date,
      member.date_of_birth,
      member.address,
      member.emergency_contact_name,
      member.emergency_contact_phone,
    ];

    const filledFields = fields.filter(field => field).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  return (
    <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              Incomplete Team Profiles
            </CardTitle>
            <Badge variant="secondary" className="ml-2">
              {incompleteMembers.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <Alert className="mb-4 bg-blue-100 border-blue-300 dark:bg-blue-900/30">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              The following team members have incomplete profiles. Please follow up to ensure all required information is provided.
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading team members...
            </div>
          ) : (
            <div className="space-y-3">
              {incompleteMembers.map((member) => {
                const completion = getCompletionPercentage(member);
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{member.display_name || 'No name'}</p>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: TEAM_MEMBER_ROLE_COLORS[member.role_type] + '20',
                            color: TEAM_MEMBER_ROLE_COLORS[member.role_type],
                          }}
                        >
                          {TEAM_MEMBER_ROLE_LABELS[member.role_type]}
                        </Badge>
                      </div>
                      
                      {member.position && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {member.position}
                        </p>
                      )}

                      {/* Completion Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Profile completion</span>
                          <span className="font-medium">{completion}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>

                      {/* Missing Fields Indicator */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Missing: {
                            [
                              !member.date_of_birth && 'DOB',
                              !member.address && 'Address',
                              !member.emergency_contact_name && 'Emergency Contact',
                            ].filter(Boolean).join(', ') || 'Basic info only'
                          }
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to People module with this member selected
                        // For now, just log the action
                        console.log('View profile:', member.id);
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 inline mr-1" />
              Follow up with team members to complete profiles
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // Navigate to People module
                console.log('Navigate to People module');
              }}
            >
              Go to People Module
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
