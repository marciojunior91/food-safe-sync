// Feed Module - Iteration 13
// Activity feed, notifications, and real-time updates
// Team member selection allows staff to identify themselves on shared accounts

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFeed } from "@/hooks/useFeed";
import { useUserContext } from "@/hooks/useUserContext";
import { FeedFilters as FeedFiltersType } from "@/types/feed";
import FeedList from "@/components/feed/FeedList";
import FeedStats from "@/components/feed/FeedStats";
import FeedFilters from "@/components/feed/FeedFilters";
import { IncompleteProfilesAlert } from "@/components/feed/IncompleteProfilesAlert";
import { UserSelectionDialog } from "@/components/labels/UserSelectionDialog";
import { Plus, RefreshCw, User, AlertCircle } from "lucide-react";
import type { TeamMember } from "@/types/teamMembers";

export default function FeedModule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { context, loading: contextLoading } = useUserContext();
  const [filters, setFilters] = useState<FeedFiltersType>({});
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  
  const {
    feedItems,
    loading,
    error,
    unreadCount,
    fetchFeed,
    markAsRead,
    deleteFeedItem,
  } = useFeed(context?.user_id, context?.organization_id);

  // Auto-open user selection dialog on first mount if no user selected
  useEffect(() => {
    if (!contextLoading && context?.organization_id && !selectedUser && !hasAutoOpened) {
      setUserDialogOpen(true);
      setHasAutoOpened(true);
    }
  }, [contextLoading, context?.organization_id, selectedUser, hasAutoOpened]);

  // Fetch feed on mount and when filters change
  useEffect(() => {
    if (context?.organization_id) {
      fetchFeed(filters);
    }
  }, [context?.organization_id, filters, fetchFeed]);

  // Handle user selection
  const handleUserSelected = (user: TeamMember) => {
    setSelectedUser(user);
    toast({
      title: "Team Member Selected",
      description: `Viewing feed as ${user.display_name}`,
    });
  };

  // Handle mark as read
  const handleMarkAsRead = async (itemId: string) => {
    // Use selected team member's auth_role_id if available, otherwise use logged-in user
    const userId = selectedUser?.auth_role_id || context?.user_id;
    
    if (!userId) return;
    
    const success = await markAsRead(itemId);
    if (success) {
      toast({
        title: "Marked as read",
        description: "Feed item has been marked as read.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to mark item as read.",
        variant: "destructive",
      });
    }
  };

  // Handle mark as unread (not supported yet - would need to delete read record)
  const handleMarkAsUnread = async (itemId: string) => {
    toast({
      title: "Coming soon",
      description: "Mark as unread functionality will be added.",
    });
  };

  // Handle delete
  const handleDelete = async (itemId: string) => {
    const success = await deleteFeedItem(itemId);
    if (success) {
      toast({
        title: "Deleted",
        description: "Feed item has been deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete feed item.",
        variant: "destructive",
      });
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchFeed(filters);
    toast({
      title: "Refreshed",
      description: "Feed has been refreshed.",
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
  };

  // Handle item click (could open detail modal in future)
  const handleItemClick = (item: any) => {
    // Use selected team member's auth_role_id if available, otherwise use logged-in user
    const userId = selectedUser?.auth_role_id || context?.user_id;
    
    // For now, just mark as read if not already read by this user
    if (!item.feed_reads?.some((read: any) => read.user_id === userId)) {
      handleMarkAsRead(item.id);
    }
  };

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

  if (!context?.organization_id) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Please log in to view your feed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Team Member Selection Dialog */}
      <UserSelectionDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSelectUser={handleUserSelected}
        organizationId={context?.organization_id}
        title="Select Team Member"
        description="Choose who is viewing the feed"
      />

      {/* Incomplete Profile Warning */}
      {selectedUser && !selectedUser.profile_complete && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Profile Incomplete
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  {selectedUser.display_name}'s profile is not complete. Please update personal information, emergency contacts, and required certificates in the People module.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  // Navigate to People module with this member ID
                  // For admins: go directly, for staff: will require PIN verification
                  navigate(`/people/${selectedUser.id}`);
                }}
              >
                Complete Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manager Alert for Incomplete Profiles */}
      <IncompleteProfilesAlert 
        organizationId={context?.organization_id || ''} 
        userRole={context?.user_role}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feed</h1>
            <p className="text-muted-foreground">
              Stay updated with notifications and activity feed
            </p>
          </div>
          {/* Selected User Badge */}
          {selectedUser && (
            <Badge variant="secondary" className="h-fit">
              <User className="w-3 h-3 mr-1" />
              {selectedUser.display_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Select Team Member Button */}
          <Button
            variant="outline"
            onClick={() => setUserDialogOpen(true)}
          >
            <User className="w-4 h-4 mr-2" />
            {selectedUser ? 'Change User' : 'Select User'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {/* Create Feed Item button - Only for admins/managers */}
          {(context?.user_role === "admin" ||
            context?.user_role === "manager" ||
            context?.user_role === "owner") && (
            <Button onClick={() => toast({ title: "Coming soon!", description: "Create feed item functionality will be added." })}>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <FeedStats 
        items={feedItems} 
        currentUserId={selectedUser?.auth_role_id || context?.user_id} 
      />

      <Separator />

      {/* Filters */}
      <FeedFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      <Separator />

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Error loading feed: {error.message}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feed List */}
      {!error && (
        <FeedList
          items={feedItems}
          loading={loading}
          currentUserId={selectedUser?.auth_role_id || context?.user_id}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDelete}
          onItemClick={handleItemClick}
        />
      )}
    </div>
  );
}
