import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Shield, AlertCircle } from "lucide-react";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
export function AdminPanel() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const {
    user
  } = useAuth();
  const {
    roles,
    highestRole,
    loading: rolesLoading,
    isAdmin,
    isManager
  } = useUserRole();
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchUserProfile();
  }, [user]);
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('organization_id, display_name, phone, position').eq('user_id', user.id).single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (loading || rolesLoading) {
    return;
  }
  return <div className="space-y-6">
      {/* User Profile & Role Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            User Profile & Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Display Name</p>
                <p className="font-medium">{userProfile?.display_name || 'Not set'}</p>
              </div>
              
              {userProfile?.position && <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{userProfile.position}</p>
                </div>}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Assigned Roles</p>
                <div className="flex flex-wrap gap-2">
                  {roles && roles.length > 0 ? roles.map(role => <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {role}
                      </Badge>) : <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      No roles assigned
                    </div>}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Highest Role</p>
                <p className="font-medium">{highestRole || 'None'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{user?.id}</p>
              </div>
            </div>
            
            {isAdmin && <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm font-medium">
                  ✅ You have admin access - Staff management is available below
                </p>
              </div>}

            {(!roles || !roles.length) && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> You don't have any roles assigned yet. Contact an administrator to assign you a role.
                </p>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Staff Management - Show for admins */}
      {isAdmin && <StaffManagement />}
    </div>;
}