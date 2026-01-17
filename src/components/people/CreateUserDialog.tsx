// Create User with Credentials Dialog
// Calls edge function to create Supabase Auth user + profile + team member

import { useState } from "react";
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
import { Loader2, UserPlus } from "lucide-react";
import { useUserContext } from "@/hooks/useUserContext";

// Form validation schema - simplified for auth user creation only
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  role: z.enum(["admin", "manager", "leader_chef", "cook", "barista"], {
    required_error: "Please select a role",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const { toast } = useToast();
  const { context } = useUserContext();
  const [loading, setLoading] = useState(false);

  console.log('[CreateUserDialog] Dialog open:', open);
  console.log('[CreateUserDialog] Context:', context);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      displayName: "",
      role: undefined,
    },
  });

  console.log('[CreateUserDialog] Form state:', form.formState);
  console.log('[CreateUserDialog] Form errors:', form.formState.errors);

  const onSubmit = async (values: FormValues) => {
    console.log('[CreateUserDialog] onSubmit called with values:', values);
    console.log('[CreateUserDialog] Context:', context);
    
    if (!context?.organization_id) {
      console.error('[CreateUserDialog] No organization_id in context');
      toast({
        title: "Error",
        description: "No organization context found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log('[CreateUserDialog] Starting invitation process...');

    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log('[CreateUserDialog] Session:', session ? 'Found' : 'Not found');

      if (!session) {
        throw new Error("No active session. Please log in.");
      }

      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      console.log('[CreateUserDialog] Supabase URL:', supabaseUrl);
      
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured");
      }

      // Call edge function to send invitation
      console.log('[CreateUserDialog] Calling invite-user function...');
      const response = await fetch(
        `${supabaseUrl}/functions/v1/invite-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: values.email,
            display_name: values.displayName,
            role_type: values.role,
            organization_id: context.organization_id,
          }),
        }
      );

      console.log('[CreateUserDialog] Response status:', response.status);
      const result = await response.json();
      console.log('[CreateUserDialog] Response body:', result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      // Success! Show message about email
      toast({
        title: "✅ User Created Successfully",
        description: (
          <div className="space-y-2">
            <p><strong>{values.displayName}</strong> has been created!</p>
            <p className="text-sm">
              📧 A password reset email has been sent to <strong>{values.email}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              The user should check their inbox (and spam folder) to set their password.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-2 rounded mt-2">
              <p className="text-xs font-semibold text-amber-800">Backup Option:</p>
              <p className="text-xs text-amber-700">
                If email doesn't arrive, user can login with password: <code className="font-mono bg-amber-100 px-1">TampaAPP@2026</code>
              </p>
            </div>
          </div>
        ),
        duration: 12000, // Show for 12 seconds
      });

      // Reset form
      form.reset();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
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
            <UserPlus className="w-5 h-5" />
            Create Auth User
          </DialogTitle>
          <DialogDescription>
            Create a new authentication user account. This creates a login account only (not a team member profile).
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Default password: <code className="font-mono bg-muted px-1 rounded">TampaAPP@2026</code>
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Fill in the required fields marked with * to send an invitation.
            </div>
            
            {/* Two-column grid for Email and Display Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Invitation will be sent to this email
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
            </div>

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="leader_chef">Leader Chef</SelectItem>
                      <SelectItem value="cook">Cook</SelectItem>
                      <SelectItem value="barista">Barista</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    User's role determines their permissions in the system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Invitation
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
