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
import { Loader2 } from "lucide-react";
import { formatPhoneNumber, getRawPhoneNumber, isValidPhoneNumber } from "@/utils/phoneFormat";

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

  // Form state - only fields that exist in the database
  const [formData, setFormData] = useState({
    display_name: user.display_name || "",
    email: user.email || "",
    phone: user.phone || "",
    position: user.position || "",
    role: user.role || "cook", // Default to cook instead of non-existent staff
    hire_date: user.hire_date || "", // Note: Using hire_date, not admission_date
  });

  // Reset form when user changes
  useEffect(() => {
    setFormData({
      display_name: user.display_name || "",
      email: user.email || "",
      phone: user.phone || "",
      position: user.position || "",
      role: user.role || "cook",
      hire_date: user.hire_date || "",
    });
  }, [user, open]);

  // Check permissions - admin can edit everything, manager can edit most things
  const isAdmin = context?.user_role === "admin";
  const isManager = context?.user_role === "manager";
  const isOwnProfile = context?.user_id === user.user_id;
  const canEdit = isAdmin || isManager || isOwnProfile;
  const canEditRole = isAdmin || isManager; // Admins and managers can edit roles

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    // Special handling for phone field - format as user types
    if (field === "phone") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
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

    // Phone validation (if provided)
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare update data - only include fields that exist in database
      const updateData: Partial<UserProfile> = {
        display_name: formData.display_name,
        email: formData.email,
        phone: formData.phone ? getRawPhoneNumber(formData.phone) : null,
        position: formData.position || null,
      };

      // Only include role if user has permission to edit it
      if (canEditRole) {
        updateData.role = formData.role as UserRole;
      }

      // Only admins can edit hire date
      if (isAdmin && formData.hire_date) {
        updateData.hire_date = formData.hire_date;
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
            <h3 className="text-sm font-semibold">Personal Information</h3>

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

              {/* Phone with Formatting */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  Format: (XXX) XXX-XXXX
                </p>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Employment Information</h3>

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
                    <SelectItem value="manager">👨‍💼 Manager</SelectItem>
                    <SelectItem value="leader_chef">👨‍🍳 Leader Chef</SelectItem>
                    <SelectItem value="cook">🍳 Cook</SelectItem>
                    <SelectItem value="barista">☕ Barista</SelectItem>
                    <SelectItem value="staff">👤 Staff</SelectItem>
                  </SelectContent>
                </Select>
                {!canEditRole && (
                  <p className="text-xs text-muted-foreground">
                    Admin/Manager only field
                  </p>
                )}
              </div>

              {/* Hire Date (formerly admission_date) */}
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleChange("hire_date", e.target.value)}
                  disabled={!isAdmin && !isManager}
                />
                {!isAdmin && !isManager && (
                  <p className="text-xs text-muted-foreground">
                    Admin/Manager only field
                  </p>
                )}
              </div>
            </div>
          </div>

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
  );
}
