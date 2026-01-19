// UserProfile Component - Team Member Profile View
// Shows complete team member information, documents, and settings
// Note: This component displays TEAM MEMBERS (real people with profiles)
// NOT auth users (which are just shared login accounts)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserContext } from "@/hooks/useUserContext";
import { TeamMember } from "@/types/teamMembers";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Shield,
  FileText,
  Activity,
  Settings,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { TeamMemberEditDialog } from "./TeamMemberEditDialog";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { context } = useUserContext();
  const { teamMembers, loading, fetchTeamMembers } = useTeamMembers();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch team members
  useEffect(() => {
    if (context?.organization_id && userId) {
      fetchTeamMembers({ organization_id: context.organization_id });
    }
  }, [context?.organization_id, userId]);

  // Find the specific team member by ID
  useEffect(() => {
    if (teamMembers.length > 0 && userId) {
      const foundMember = teamMembers.find((m) => m.id === userId);
      setTeamMember(foundMember || null);
    }
  }, [teamMembers, userId]);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle edit team member
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    // Refresh team member data
    if (context?.organization_id && userId) {
      fetchTeamMembers({ organization_id: context.organization_id });
    }
  };

  // Handle delete team member
  const handleDelete = () => {
    toast({
      title: "Are you sure?",
      description: "Delete team member functionality will be implemented with confirmation.",
      variant: "destructive",
    });
  };

  // Check if current user can edit
  const canEdit =
    context?.user_role === "admin" ||
    context?.user_role === "owner" ||
    context?.user_role === "manager";

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Team member not found
  if (!teamMember) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Team Member not found</p>
              <p className="text-sm text-muted-foreground">
                The team member profile you're looking for doesn't exist or you don't have access.
              </p>
            </div>
            <Button onClick={() => navigate("/people")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to People
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/people")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Team Member Profile</h1>
          <p className="text-muted-foreground">
            {teamMember.display_name}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {(context?.user_role === "admin" || context?.user_role === "owner") && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

        {/* Team Member Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl">
                    {getInitials(teamMember.display_name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{teamMember.display_name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {teamMember.position || "No position set"}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {teamMember.role_type}
                    </Badge>
                    {!teamMember.profile_complete && (
                      <Badge variant="destructive">
                        Profile Incomplete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {teamMember.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{teamMember.email}</span>
                  </div>
                )}
                {teamMember.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{teamMember.phone}</span>
                  </div>
                )}
                {teamMember.address && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{teamMember.address}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Employment Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {teamMember.hire_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Hired: {format(new Date(teamMember.hire_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Role: {teamMember.role_type}</span>
                </div>
              </div>
            </div>

            {!teamMember.profile_complete && teamMember.required_fields_missing && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-amber-600">Missing Information</h3>
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Please complete the following fields to finish profile setup:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm text-amber-700 dark:text-amber-300">
                      {teamMember.required_fields_missing.map((field: string) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Edit Button */}
            <div className="flex justify-end">
              <Button onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile & Upload Documents
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Member Edit Dialog */}
        <TeamMemberEditDialog
          teamMember={teamMember}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      </div>
    );
}
