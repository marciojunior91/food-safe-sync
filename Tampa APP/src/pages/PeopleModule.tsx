// People Module - Iteration 13
// Team management, roles, certifications, and user profiles

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePeople } from "@/hooks/usePeople";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserContext } from "@/hooks/useUserContext";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlanEnforcement } from "@/hooks/usePlanEnforcement";
import { UserFilters, UserProfile } from "@/types/people";
import { TeamMember } from "@/types/teamMembers";
import PeopleList from "@/components/people/PeopleList";
import PeopleStats from "@/components/people/PeopleStats";
import PeopleFilters from "@/components/people/PeopleFilters";
import EditUserDialog from "@/components/people/EditUserDialog";
import { TeamMemberEditDialog } from "@/components/people/TeamMemberEditDialog";
import CreateUserDialog from "@/components/people/CreateUserDialog";
import CreateTeamMemberDialog from "@/components/people/CreateTeamMemberDialog";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { Plus, RefreshCw, Users, Briefcase, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function People() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { context, loading: contextLoading } = useUserContext();
  const { role, isAdmin, isManager, canManageTeamMembers } = useUserRole();
  const { checkTeamMemberLimit, upgradeModalProps } = usePlanEnforcement();
  const [filters, setFilters] = useState<UserFilters>({});
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "team">("team");
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createTeamMemberDialogOpen, setCreateTeamMemberDialogOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>("");  // BUG-008 FIX
  
  const {
    users,
    loading: usersLoading,
    error: usersError,
    fetchUsers,
  } = usePeople(context?.organization_id);

  const {
    teamMembers,
    loading: teamLoading,
    error: teamError,
    fetchTeamMembers,
  } = useTeamMembers();

  // Fetch users on mount and when filters change
  useEffect(() => {
    if (context?.organization_id) {
      fetchUsers(filters);
    }
  }, [context?.organization_id, filters, fetchUsers]);

  // Fetch team members on mount
  useEffect(() => {
    if (context?.organization_id) {
      fetchTeamMembers({ organization_id: context.organization_id });
    }
  }, [context?.organization_id]);

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === "users") {
      fetchUsers(filters);
    } else {
      if (context?.organization_id) {
        fetchTeamMembers({ organization_id: context.organization_id });
      }
    }
    toast({
      title: "Refreshed",
      description: `${activeTab === "users" ? "Auth users" : "Team members"} list has been refreshed.`,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
  };

  // Handle view profile
  const handleViewProfile = (user: UserProfile) => {
    navigate(`/people/${user.user_id}`);
  };

  // Handle edit user
  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
  };

  // Handle edit team member
  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    // Refresh user list
    if (context?.organization_id) {
      fetchUsers(filters);
    }
  };

  // Handle team member edit success
  const handleTeamMemberEditSuccess = () => {
    // Refresh team members list
    if (context?.organization_id) {
      fetchTeamMembers({ organization_id: context.organization_id });
    }
    setEditingTeamMember(null);
    toast({
      title: "Success",
      description: "Team member updated successfully.",
    });
  };

  // Handle create user success
  const handleCreateUserSuccess = () => {
    // Refresh both lists since edge function creates auth user + team member
    if (context?.organization_id) {
      fetchUsers(filters);
      fetchTeamMembers({ organization_id: context.organization_id });
    }
    toast({
      title: "Success",
      description: "User created successfully. They can now log in.",
    });
  };

  // Handle create team member success
  const handleCreateTeamMemberSuccess = () => {
    // Refresh team members list
    if (context?.organization_id) {
      fetchTeamMembers({ organization_id: context.organization_id });
    }
    toast({
      title: "Success",
      description: "Team member created successfully.",
    });
  };

  // Handle add user button click with limit check
  const handleAddUserClick = () => {
    const currentCount = users.length;
    if (!checkTeamMemberLimit(currentCount)) {
      return; // Modal will show automatically
    }
    setCreateUserDialogOpen(true);
  };

  // Handle add team member button click with limit check
  const handleAddTeamMemberClick = () => {
    const currentCount = teamMembers.length;
    if (!checkTeamMemberLimit(currentCount)) {
      return; // Modal will show automatically
    }
    setCreateTeamMemberDialogOpen(true);
  };

  // BUG-008 FIX: Filter team members by search query
  const filteredTeamMembers = teamMembers.filter((member) => {
    if (!teamSearchQuery) return true;
    
    const searchLower = teamSearchQuery.toLowerCase();
    return (
      member.display_name.toLowerCase().includes(searchLower) ||
      member.position?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.role_type.toLowerCase().includes(searchLower)
    );
  });

  if (contextLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // BUG-006 FIX: Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[PeopleModule] User context:', context);
  }

  if (!context?.organization_id) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Please log in to view team members.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Debug: Context loaded = {contextLoading ? 'loading' : 'loaded'}, 
              Organization ID = {context?.organization_id || 'null'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground">
            Manage your team members and user accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={activeTab === "users" ? usersLoading : teamLoading}
          >
            <RefreshCw className={`w-4 h-4 ${(activeTab === "users" ? usersLoading : teamLoading) ? "animate-spin" : ""}`} />
          </Button>
          {/* Add buttons - Only for admins/managers */}
          {canManageTeamMembers && (
            <>
              {activeTab === "users" && (
                <Button onClick={handleAddUserClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              )}
              {activeTab === "team" && (
                <Button onClick={handleAddTeamMemberClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Tabs for Users vs Team Members */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "team")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Team Members ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Auth Users ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Operational team members with PIN-based access for daily work (cooking, serving, cleaning, etc.)
              </p>
              
              {/* BUG-008 FIX: Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team members by name, role, position, or email..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {teamSearchQuery && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing {filteredTeamMembers.length} of {teamMembers.length} team members
                  </p>
                )}
              </div>
              
              {/* Error State */}
              {teamError && (
                <div className="p-4 border border-destructive rounded-md mb-4">
                  <p className="text-sm text-destructive">
                    Error loading team members: {teamError.message || String(teamError)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {teamLoading && (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading team members...</p>
                </div>
              )}

              {/* Team Members List */}
              {!teamLoading && !teamError && (
                <div className="space-y-3">
                  {filteredTeamMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {teamSearchQuery 
                          ? 'No team members match your search'
                          : 'No team members found'}
                      </p>
                      {canManageTeamMembers && !teamSearchQuery && (
                        <Button
                          onClick={() => setCreateTeamMemberDialogOpen(true)}
                          className="mt-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Team Member
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredTeamMembers.map((member) => (
                      <Card key={member.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{member.display_name}</h3>
                              <span className="text-sm px-2 py-1 rounded bg-primary/10 text-primary">
                                {member.role_type}
                              </span>
                              {!member.is_active && (
                                <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                                  Inactive
                                </span>
                              )}
                              {!member.profile_complete && (
                                <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning">
                                  Incomplete
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{member.position}</p>
                            {member.email && (
                              <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                            )}
                          </div>
                          {canManageTeamMembers && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTeamMember(member)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Users Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          {/* Statistics Dashboard */}
          <PeopleStats users={users} />

          <Separator />

          {/* Filters */}
          <PeopleFilters
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
          />

          {/* Error State */}
          {usersError && (
            <Card className="border-destructive">
              <CardContent className="p-6">
                <p className="text-destructive">
                  Error loading users: {usersError.message || String(usersError)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* People List */}
          <PeopleList
            users={users}
            loading={usersLoading}
            onViewProfile={handleViewProfile}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Edit Team Member Dialog with PIN Protection */}
      {editingTeamMember && (
        <TeamMemberEditDialog
          open={!!editingTeamMember}
          onOpenChange={(open) => !open && setEditingTeamMember(null)}
          teamMember={editingTeamMember}
          onSuccess={handleTeamMemberEditSuccess}
        />
      )}

      {/* Create User with Credentials Dialog */}
      <CreateUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        onSuccess={handleCreateUserSuccess}
      />

      {/* Create Team Member Dialog */}
      <CreateTeamMemberDialog
        open={createTeamMemberDialogOpen}
        onOpenChange={setCreateTeamMemberDialogOpen}
        onSuccess={handleCreateTeamMemberSuccess}
      />

      {/* Upgrade Modal for Plan Limits */}
      <UpgradeModal {...upgradeModalProps} />
    </div>
  );
}
