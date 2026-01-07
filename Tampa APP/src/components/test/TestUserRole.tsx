import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function TestUserRole() {
  const { 
    role, 
    loading, 
    isAdmin, 
    isManager,
    isLeaderChef,
    canManageTeamMembers,
    canEditWithoutPIN
  } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading user role...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Test: useUserRole Hook</h2>
        <p className="text-muted-foreground">
          Tests system role retrieval from user_roles table
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current System Role</CardTitle>
          <CardDescription>
            Role from user_roles table (not profiles.role which is deprecated)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-lg px-4 py-2">
              {role || 'No Role Assigned'}
            </Badge>
            {!role && (
              <p className="text-sm text-muted-foreground">
                ⚠️ No role found in user_roles table for current user
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Checks (Boolean Flags)</CardTitle>
          <CardDescription>
            Quick permission checks based on current role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className={isAdmin ? 'font-semibold' : 'text-muted-foreground'}>
                Is Admin
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isManager ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className={isManager ? 'font-semibold' : 'text-muted-foreground'}>
                Is Manager
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isLeaderChef ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className={isLeaderChef ? 'font-semibold' : 'text-muted-foreground'}>
                Is Leader Chef
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canManageTeamMembers ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className={canManageTeamMembers ? 'font-semibold' : 'text-muted-foreground'}>
                Can Manage Team Members
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canEditWithoutPIN ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className={canEditWithoutPIN ? 'font-semibold' : 'text-muted-foreground'}>
                Can Edit Without PIN
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy Check</CardTitle>
          <CardDescription>
            Based on current role, checks what permissions apply
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Has Staff Access (Basic)</span>
            <Badge variant={role !== null ? 'default' : 'secondary'}>
              {role !== null ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Has Leader Chef Access</span>
            <Badge variant={isLeaderChef || isManager || isAdmin ? 'default' : 'secondary'}>
              {isLeaderChef || isManager || isAdmin ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Has Manager Access</span>
            <Badge variant={isManager || isAdmin ? 'default' : 'secondary'}>
              {isManager || isAdmin ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span>Has Admin Access (Full)</span>
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {isAdmin ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✅ <strong>Step 1:</strong> Verify your role displays correctly</p>
          <p>✅ <strong>Step 2:</strong> Check role-specific permissions match your role</p>
          <p>✅ <strong>Step 3:</strong> Test hierarchy - higher roles should pass all checks</p>
          <p className="pt-2 text-muted-foreground">
            💡 To test different roles, you need to update user_roles table in Supabase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
