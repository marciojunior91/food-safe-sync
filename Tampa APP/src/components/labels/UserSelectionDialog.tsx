import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  position: string | null;
}

interface UserSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: UserProfile) => void;
  organizationId?: string; // Optional: if provided, skip auth check
}

export function UserSelectionDialog({ open, onOpenChange, onSelectUser, organizationId }: UserSelectionDialogProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
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

        console.log("Current user ID:", user.id);

        const { data: currentProfile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile error:", profileError);
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        console.log("Current profile organization_id:", currentProfile?.organization_id);

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

      console.log("Fetching users for organization_id:", orgId);

      // Direct database query - secure with RLS policies
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, position')
        .eq('organization_id', orgId)
        .order('display_name', { ascending: true });

      if (error) {
        console.error("Error fetching users:", error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      console.log("Fetched users:", data);
      setUsers(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No Users Found",
          description: "No users found in your organization. Make sure user profiles are created.",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: UserProfile) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select User</DialogTitle>
          <DialogDescription>
            Choose who is preparing this product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
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
                    <p className="font-medium">{user.display_name || "No name"}</p>
                    {user.position && (
                      <p className="text-sm text-muted-foreground">{user.position}</p>
                    )}
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
