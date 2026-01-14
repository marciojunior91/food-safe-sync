// Add Team Member Page
// Dedicated page for creating new team members

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CreateTeamMemberDialog from "@/components/people/CreateTeamMemberDialog";
import { useState } from "react";

export default function AddTeamMember() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(true);

  const handleSuccess = () => {
    // Navigate back to people module after successful creation
    navigate("/people");
  };

  const handleCancel = () => {
    // Navigate back if user cancels
    navigate("/people");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/people")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Team Member</h1>
            <p className="text-muted-foreground">
              Create a new team member for your organization
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Team Member</CardTitle>
          <CardDescription>
            Add a new operational team member to your organization. You can create a PIN-only member
            or link them to an existing auth user account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Two Options:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>PIN-Only Member</strong>: Team member without email/password login
                (for kitchen staff, baristas, etc.)
              </li>
              <li>
                <strong>Link to Auth User</strong>: Connect team member profile to an existing
                user account for full access
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dialog that opens automatically */}
      <CreateTeamMemberDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) handleCancel();
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
