// UserProfile Component - Detailed user view with tabs
// Shows complete user information, documents, activity, and settings

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePeople } from "@/hooks/usePeople";
import { useUserContext } from "@/hooks/useUserContext";
import { UserProfile as UserProfileType, UserDocument } from "@/types/people";
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
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import EditUserDialog from "./EditUserDialog";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { context } = useUserContext();
  const { users, loading, fetchUsers } = usePeople(context?.organization_id);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch user data
  useEffect(() => {
    if (context?.organization_id && userId) {
      fetchUsers({ search: userId });
    }
  }, [context?.organization_id, userId, fetchUsers]);

  // Find the specific user
  useEffect(() => {
    if (users.length > 0 && userId) {
      const foundUser = users.find((u) => u.user_id === userId);
      setUser(foundUser || null);
    }
  }, [users, userId]);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-500",
      owner: "bg-purple-500",
      leader_chef: "bg-orange-500",
      cook: "bg-blue-500",
      barista: "bg-green-500",
    };
    return colors[role as keyof typeof colors] || "bg-gray-500";
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      admin: "destructive",
      owner: "default",
      leader_chef: "secondary",
      cook: "outline",
      barista: "outline",
    };
    return variants[role as keyof typeof variants] || "outline";
  };

  // Calculate compliance status
  const getComplianceStatus = (documents?: UserDocument[]) => {
    if (!documents || documents.length === 0) {
      return {
        status: "no_documents",
        badge: <Badge variant="outline">No Documents</Badge>,
        color: "text-muted-foreground",
      };
    }

    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    const hasExpired = documents.some(
      (doc) => doc.expiration_date && isBefore(new Date(doc.expiration_date), now)
    );

    const hasExpiringSoon = documents.some(
      (doc) =>
        doc.expiration_date &&
        isAfter(new Date(doc.expiration_date), now) &&
        isBefore(new Date(doc.expiration_date), thirtyDaysFromNow)
    );

    if (hasExpired) {
      return {
        status: "expired",
        badge: <Badge variant="destructive">🔴 Expired Documents</Badge>,
        color: "text-red-600",
      };
    }

    if (hasExpiringSoon) {
      return {
        status: "expiring",
        badge: <Badge className="bg-amber-600">🟡 Expiring Soon</Badge>,
        color: "text-amber-600",
      };
    }

    return {
      status: "compliant",
      badge: <Badge className="bg-green-600">✅ Compliant</Badge>,
      color: "text-green-600",
    };
  };

  // Handle edit user
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    // Refresh user data
    if (context?.organization_id && userId) {
      fetchUsers({ search: userId });
    }
  };

  // Handle delete user
  const handleDelete = () => {
    toast({
      title: "Are you sure?",
      description: "Delete user functionality will be implemented with confirmation.",
      variant: "destructive",
    });
  };

  // Handle document upload
  const handleUploadDocument = () => {
    toast({
      title: "Coming soon!",
      description: "Document upload will be implemented.",
    });
  };

  // Check if current user can edit
  const canEdit =
    context?.user_role === "admin" ||
    context?.user_role === "owner" ||
    context?.user_id === userId;

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

  // User not found
  if (!user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">User not found</p>
              <p className="text-sm text-muted-foreground">
                The user profile you're looking for doesn't exist or you don't have access.
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

  const compliance = getComplianceStatus(user.user_documents);

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
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">
            View and manage user information
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {(context?.user_role === "admin" || 
              context?.user_role === "owner" || 
              context?.user_role === "leader_chef") && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* User Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className={`w-24 h-24 ${getRoleColor(user.role)} text-white text-2xl`}>
                <AvatarFallback className="bg-transparent">
                  {getInitials(user.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <Badge variant={getRoleBadgeVariant(user.role) as any}>
                  {user.role === "leader_chef" ? "Leader Chef" : user.role}
                </Badge>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{user.display_name}</h2>
                {user.position && (
                  <p className="text-muted-foreground">{user.position}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {compliance.badge}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${user.email}`} className="hover:underline">
                      {user.email}
                    </a>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${user.phone}`} className="hover:underline">
                      {user.phone}
                    </a>
                  </div>
                )}
                {user.hire_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Hired {format(new Date(user.hire_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {user.department_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>Dept: {user.department_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Shield className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic user details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="mt-1">{user.display_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="mt-1">{user.email || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="mt-1">{user.phone || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                  <p className="mt-1">{user.position || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="mt-1">{user.department_id || "Not assigned"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
              <CardDescription>Work-related details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <p className="mt-1">
                    <Badge variant={getRoleBadgeVariant(user.role) as any}>
                      {user.role === "leader_chef" ? "Leader Chef" : user.role}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                  <p className="mt-1">
                    {user.hire_date
                      ? format(new Date(user.hire_date), "MMM d, yyyy")
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time at Company</label>
                  <p className="mt-1">
                    {user.hire_date
                      ? formatDistanceToNow(new Date(user.hire_date), { addSuffix: false })
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Document compliance and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {compliance.status === "compliant" && (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  )}
                  {compliance.status === "expiring" && (
                    <Clock className="w-8 h-8 text-amber-600" />
                  )}
                  {compliance.status === "expired" && (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${compliance.color}`}>
                      {compliance.status === "compliant" && "All Documents Valid"}
                      {compliance.status === "expiring" && "Documents Expiring Soon"}
                      {compliance.status === "expired" && "Expired Documents"}
                      {compliance.status === "no_documents" && "No Documents on File"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.user_documents?.length || 0} document(s) on file
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setActiveTab("documents")}>
                  View Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents & Certifications</CardTitle>
                  <CardDescription>
                    Manage user documents, certificates, and compliance files
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button onClick={handleUploadDocument}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!user.user_documents || user.user_documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">No documents on file</p>
                  <p className="text-sm text-muted-foreground">
                    Upload certificates and compliance documents
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.user_documents.map((doc) => {
                    const isExpired =
                      doc.expiration_date &&
                      isBefore(new Date(doc.expiration_date), new Date());
                    const isExpiringSoon =
                      doc.expiration_date &&
                      !isExpired &&
                      isBefore(new Date(doc.expiration_date), addDays(new Date(), 30));

                    return (
                      <Card key={doc.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-muted rounded-lg">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium">{doc.document_name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {doc.document_type.replace("_", " ")}
                                </p>
                                {doc.expiration_date && (
                                  <p className="text-sm text-muted-foreground">
                                    Expires: {format(new Date(doc.expiration_date), "MMM d, yyyy")}
                                    {!isExpired && (
                                      <span className="ml-2">
                                        ({formatDistanceToNow(new Date(doc.expiration_date), {
                                          addSuffix: true,
                                        })})
                                      </span>
                                    )}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  {isExpired && (
                                    <Badge variant="destructive" className="text-xs">
                                      Expired
                                    </Badge>
                                  )}
                                  {isExpiringSoon && (
                                    <Badge className="bg-amber-600 text-xs">
                                      Expiring Soon
                                    </Badge>
                                  )}
                                  {!isExpired && !isExpiringSoon && (
                                    <Badge className="bg-green-600 text-xs">
                                      Valid
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User actions and timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Activity tracking coming soon</p>
                <p className="text-sm text-muted-foreground">
                  View task completions, logins, and system actions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
              <CardDescription>Manage permissions and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Settings management coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Configure notifications, permissions, and preferences
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      {user && (
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={user}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
