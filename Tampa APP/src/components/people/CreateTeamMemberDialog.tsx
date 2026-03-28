// Create Team Member Dialog
// Creates a team member record linked to an auth user

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";
import { useUserContext } from "@/hooks/useUserContext";
import { formatPhoneNumber, getRawPhoneNumber, isValidPhoneNumber } from "@/utils/phoneFormat";
import { PositionEmojiPicker } from './PositionEmojiPicker';

const formSchema = z.object({
  authUserId: z.string().min(1, "Please select an auth user"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  position: z.string().optional(),
  positionEmoji: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  departmentId: z.string().min(1, "Please select a department"),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  role?: string;
}

interface Department {
  id: string;
  name: string;
}

interface CreateTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateTeamMemberDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTeamMemberDialogProps) {
  const { toast } = useToast();
  const { context } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authUserId: "",
      displayName: "",
      position: "",
      positionEmoji: "👨‍🍳",
      phone: "",
      email: "",
      departmentId: "",
    },
  });

  // Fetch auth users that don't have team members yet
  useEffect(() => {
    const fetchAuthUsers = async () => {
      if (!open || !context?.organization_id) return;

      setLoadingUsers(true);
      try {
        // Get all profiles in this organization with their roles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .eq("organization_id", context.organization_id)
          .order("display_name") as any;

        if (profilesError) throw profilesError;

        // Fetch roles for these users
        const userIds = (profiles || []).map((p: any) => p.user_id);
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds) as any;

        const roleMap = new Map((userRoles || []).map((r: any) => [r.user_id, r.role]));

        // Map to AuthUser format
        const usersWithEmails: AuthUser[] = (profiles || []).map((profile: any) => ({
          id: profile.user_id,
          email: profile.email || "No email",
          display_name: profile.display_name || "No name",
          role: roleMap.get(profile.user_id) || undefined,
        }));

        setAuthUsers(usersWithEmails);
      } catch (error: any) {
        console.error("Error fetching auth users:", error);
        toast({
          title: "Error loading users",
          description: "Could not load auth users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAuthUsers();
  }, [open, context?.organization_id]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!open || !context?.organization_id) return;

      setLoadingDepartments(true);
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("id, name")
          .eq("organization_id", context.organization_id)
          .order("name");

        if (error) throw error;
        setDepartments(data || []);
      } catch (error: any) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [open, context?.organization_id]);

  const onSubmit = async (values: FormValues) => {
    if (!context?.organization_id) {
      toast({
        title: "Error",
        description: "No organization context found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create team member directly
      const { data: teamMember, error: teamError} = await supabase
        .from("team_members")
        .insert({
          display_name: values.displayName,
          organization_id: context.organization_id,
          position: values.position || null,
          position_emoji: values.positionEmoji || "👨‍🍳",
          phone: values.phone ? getRawPhoneNumber(values.phone) : null,
          email: values.email || null,
          department_id: values.departmentId,
          auth_role_id: values.authUserId,
          is_active: true,
          profile_complete: false,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Success!
      toast({
        title: "Team Member Created",
        description: `${values.displayName} has been linked to the auth user and can now login.`,
      });

      // Reset form
      form.reset();
      setSelectedUserRole(null);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating team member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Team Member
          </DialogTitle>
          <DialogDescription>
            Link an existing auth user to a team member profile. This allows them to login and use the system with their assigned role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Link to Auth User (Required) - Full Width */}
            <FormField
              control={form.control}
              name="authUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Auth User *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Auto-populate display name and email from selected user
                      const selectedUser = authUsers.find(u => u.id === value);
                      if (selectedUser) {
                        if (selectedUser.display_name && selectedUser.display_name !== "No name") {
                          form.setValue("displayName", selectedUser.display_name);
                        }
                        if (selectedUser.email && selectedUser.email !== "No email") {
                          form.setValue("email", selectedUser.email);
                        }
                        // Set role from auth user
                        setSelectedUserRole(selectedUser.role || null);
                      }
                    }}
                    defaultValue={field.value}
                    disabled={loading || loadingUsers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an auth user to link" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {authUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.display_name || "No name"} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {loadingUsers
                      ? "Loading available users..."
                      : `${authUsers.length} auth users available in your organization`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Name shown in the app
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role info (auto-set from auth user) */}
            {selectedUserRole && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <span>Role:</span>
                <span className="font-medium capitalize text-foreground">{selectedUserRole.replace('_', ' ')}</span>
                <span className="text-xs">(inherited from auth user)</span>
              </div>
            )}

            {/* Two-column grid for Position and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position with Emoji Picker */}
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="positionEmoji"
                        render={({ field: emojiField }) => (
                          <PositionEmojiPicker
                            value={emojiField.value || "👨‍🍳"}
                            onChange={emojiField.onChange}
                          />
                        )}
                      />
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Line Cook, Sous Chef, etc."
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Job title or position
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department (Required) */}
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loading || loadingDepartments}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {loadingDepartments ? "Loading..." : "Required for task grouping"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Two-column grid for Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email (Optional) */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Contact email only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone (Optional) */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(123) 456-7890"
                        {...field}
                        onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                        disabled={loading}
                      />
                    </FormControl>
                  <FormDescription>
                    Contact phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Create Team Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
