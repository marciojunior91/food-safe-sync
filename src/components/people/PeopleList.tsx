import { UserProfile } from "@/types/people";
import UserCard from "./UserCard";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Grid3x3, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PeopleListProps {
  users: UserProfile[];
  loading: boolean;
  onViewProfile?: (user: UserProfile) => void;
  onEdit?: (user: UserProfile) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  showActions?: boolean;
}

export default function PeopleList({
  users,
  loading,
  onViewProfile,
  onEdit,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  showActions = true,
}: PeopleListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                </div>
                <div className="w-full space-y-2 pt-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex gap-2 w-full pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Users className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No team members found</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            There are no team members to display. Try adjusting your filters or
            add new team members.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
        >
          <Grid3x3 className="w-4 h-4 mr-2" />
          Grid
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          <List className="w-4 h-4 mr-2" />
          List
        </Button>
      </div>

      {/* User Cards */}
      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}
      >
        {users.map((user) => (
          <UserCard
            key={user.user_id}
            user={user}
            onViewProfile={onViewProfile}
            onEdit={onEdit}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      {/* End of List Message */}
      {!hasMore && users.length > 12 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          You've reached the end of the list
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {users.length} team member{users.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
