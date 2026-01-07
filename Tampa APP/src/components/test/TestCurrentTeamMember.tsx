import { useCurrentTeamMember } from '@/hooks/useCurrentTeamMember';
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TestCurrentTeamMember() {
  const { 
    currentMember, 
    selectTeamMember, 
    clearTeamMember,
    isTeamMemberSelected 
  } = useCurrentTeamMember();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Test: useCurrentTeamMember Hook</h2>
        <p className="text-muted-foreground">
          Tests tablet session management with localStorage persistence
        </p>
      </div>

      {currentMember ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Selected Team Member 
              <Badge variant="default">Active</Badge>
            </CardTitle>
            <CardDescription>
              This information is stored in localStorage and persists across page reloads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                <p className="text-lg font-semibold">{currentMember.display_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p className="text-lg">{currentMember.position || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role Type</p>
                <Badge variant="outline">{currentMember.role_type}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{currentMember.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile Complete</p>
                <Badge variant={currentMember.profile_complete ? 'default' : 'destructive'}>
                  {currentMember.profile_complete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Status</p>
                <Badge variant={currentMember.is_active ? 'default' : 'secondary'}>
                  {currentMember.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={clearTeamMember} variant="destructive">
                Clear Selection (Logout)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will remove the selection from localStorage
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Team Member Selected</CardTitle>
            <CardDescription>
              Select a team member to simulate tablet login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserSelectionDialog
              open={!isTeamMemberSelected}
              onOpenChange={() => {}}
              onSelectUser={selectTeamMember}
              title="Select Team Member"
              description="Choose your profile to continue"
            />
            <p className="text-sm text-muted-foreground mt-4">
              💡 After selection, try reloading the page - the selection persists!
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✅ <strong>Step 1:</strong> Select a team member</p>
          <p>✅ <strong>Step 2:</strong> Verify information displays correctly</p>
          <p>✅ <strong>Step 3:</strong> Reload the page (F5) - selection should persist</p>
          <p>✅ <strong>Step 4:</strong> Click "Clear Selection" - should remove from localStorage</p>
          <p>✅ <strong>Step 5:</strong> Reload again - selection should be gone</p>
        </CardContent>
      </Card>
    </div>
  );
}
