// EditUserDialog Component - Dialog for editing user information
// Supports different permission levels (admin/owner/leader_chef can edit all, user can edit own info)
// Only uses fields that actually exist in the database

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePeople } from "@/hooks/usePeople";
import { useUserContext } from "@/hooks/useUserContext";
import { UserProfile, UserRole } from "@/types/people";
import { Loader2, AlertTriangle } from "lucide-react";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  onSuccess?: () => void;
}

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  const { toast } = useToast();
  const { context } = useUserContext();
  const { updateUser, loading } = usePeople(context?.organization_id);

  // Form state - only fields that exist in the database (phone/hire_date removed for auth users)
  const [formData, setFormData] = useState({
    display_name: user.display_name || "",
    email: user.email || "",
    position: user.position || "",
    role: user.role || "staff",
  });

  // Deactivate confirmation state
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Reset form when user changes
  useEffect(() => {
    setFormData({
      display_name: user.display_name || "",
      email: user.email || "",
      position: user.position || "",
      role: user.role || "staff",
    });
  }, [user, open]);

  // Check permissions - admin can edit everything, manager can edit most things
  const isAdmin = context?.user_role === "admin";
  const isManager = context?.user_role === "manager";
  const isOwnProfile = context?.user_id === user.user_id;
  const canEdit = isAdmin || isManager || isOwnProfile;
  const canEditRole = isAdmin || isManager; // Admins and managers can edit roles
  const canDeactivate = isAdmin; // Only admins can deactivate accounts

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.display_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Display name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Handle deactivate user
  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      // Update user status to deactivated
      await updateUser(user.user_id, { 
        is_active: false 
      } as any);

      toast({
        title: "User Deactivated",
        description: `${user.display_name} has been deactivated. They will no longer be able to log in.`,
      });

      setShowDeactivateConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeactivating(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare update data
      const updateData: Partial<UserProfile> = {
        display_name: formData.display_name,
        email: formData.email,
        position: formData.position || null,
      };

      // Only include role if user has permission to edit it
      if (canEditRole) {
        updateData.role = formData.role as UserRole;
      }

      await updateUser(user.user_id, updateData);

      toast({
        title: "Success",
        description: "User information updated successfully.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user information. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Information</DialogTitle>
            <DialogDescription>
              {isOwnProfile
                ? "Update your profile information."
                : `Update information for ${user.display_name}.`}
              {!isAdmin && !isManager && " You can only edit contact information."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Account Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="display_name">
                    Display Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleChange("display_name", e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Role & Position</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Position */}
                <div className="space-y-2">
                  <Label htmlFor="position">Position / Title</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    placeholder="Head Chef"
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                    disabled={!canEditRole}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">🔴 Admin</SelectItem>
                      <SelectItem value="manager">� Manager</SelectItem>
                      <SelectItem value="staff">🔵 Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canEditRole && (
                    <p className="text-xs text-muted-foreground">
                      Admin/Manager only field
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Deactivate Section */}
            {canDeactivate && !isOwnProfile && (
              <div className="space-y-3 pt-2 border-t border-destructive/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                    <p className="text-xs text-muted-foreground">
                      Deactivate this account to prevent login access.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeactivateConfirm(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Deactivate
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{user.display_name}</strong>'s account? 
              They will no longer be able to log in. This action can be reversed by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
