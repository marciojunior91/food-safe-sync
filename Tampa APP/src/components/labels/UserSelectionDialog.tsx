// ============================================================================
// UserSelectionDialog - Team Member Selection for Shared Tablets
// ============================================================================
// This component allows users to select their team member identity on shared
// tablet accounts. It's used in:
// - Labeling module (who is preparing the product)
// - Routine tasks module (who is assigned/completing tasks)
// - Any operational workflow requiring individual identity tracking
//
// Authentication Flow:
// Layer 1: Shared account already logged in (e.g., cook@restaurant.com)
// Layer 2: Individual selects their team_member (e.g., "João Silva - Cook")
// ============================================================================

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember } from "@/types/teamMembers";
import { TEAM_MEMBER_ROLE_LABELS, TEAM_MEMBER_ROLE_COLORS } from "@/types/teamMembers";

interface UserSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: TeamMember) => void;
  organizationId?: string; // Optional: if provided, skip auth check
  title?: string; // Optional: custom title
  description?: string; // Optional: custom description
}

export function UserSelectionDialog({ 
  open, 
  onOpenChange, 
  onSelectUser, 
  organizationId,
  title = "Select Team Member",
  description = "Choose who is preparing this product"
}: UserSelectionDialogProps) {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let orgId = organizationId;

      // If organization_id is not provided as prop, get it from logged-in user
      if (!orgId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("Auth error:", authError);
          throw new Error(`Authentication failed: ${authError.message}`);
        }
        
        if (!user) {
          throw new Error("Not authenticated and no organization_id provided");
        }

        console.log("[UserSelectionDialog] Current user ID:", user.id);

        const { data: currentProfile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("[UserSelectionDialog] Profile error:", profileError);
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        console.log("[UserSelectionDialog] Current profile organization_id:", currentProfile?.organization_id);

        if (!currentProfile?.organization_id) {
          toast({
            title: "No Organization",
            description: "You are not assigned to an organization.",
            variant: "destructive",
          });
          setUsers([]);
          return;
        }

        orgId = currentProfile.organization_id;
      }

      console.log("[UserSelectionDialog] Fetching team members for organization_id:", orgId);

      // Fetch active team members - secure with RLS policies
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (error) {
        console.error("[UserSelectionDialog] Error fetching team members:", error);
        throw new Error(`Failed to fetch team members: ${error.message}`);
      }

      console.log("[UserSelectionDialog] Fetched team members:", data);
      setUsers(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No Team Members Found",
          description: "No active team members found in your organization. Please add team members first.",
        });
      }
    } catch (error) {
      console.error("[UserSelectionDialog] Error fetching team members:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: TeamMember) => {
    onSelectUser(user);
    onOpenChange(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getProfileCompletionIcon = (member: TeamMember) => {
    if (member.profile_complete) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, position, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading team members...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No team members found matching your search" : "No team members found"}
              </div>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{user.display_name || "No name"}</p>
                      {getProfileCompletionIcon(user)}
                    </div>
                    {user.position && (
                      <p className="text-sm text-muted-foreground">{user.position}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: TEAM_MEMBER_ROLE_COLORS[user.role_type] + '20',
                          color: TEAM_MEMBER_ROLE_COLORS[user.role_type],
                        }}
                      >
                        {TEAM_MEMBER_ROLE_LABELS[user.role_type]}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
