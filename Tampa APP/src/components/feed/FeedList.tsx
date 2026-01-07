import { FeedItem } from "@/types/feed";
import FeedCard from "./FeedCard";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedListProps {
  items: FeedItem[];
  loading: boolean;
  currentUserId?: string;
  onMarkAsRead?: (itemId: string) => void;
  onMarkAsUnread?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onItemClick?: (item: FeedItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export default function FeedList({
  items,
  loading,
  currentUserId,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onItemClick,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: FeedListProps) {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Inbox className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No feed items</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            There are no notifications or updates to show at the moment. Check
            back later for new activity.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feed Items */}
      {items.map((item) => (
        <FeedCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
          onDelete={onDelete}
          onClick={onItemClick}
        />
      ))}

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
      {!hasMore && items.length > 10 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          You've reached the end of the feed
        </div>
      )}
    </div>
  );
}
