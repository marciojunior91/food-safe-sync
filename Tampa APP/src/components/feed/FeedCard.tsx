import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeedItem } from "@/types/feed";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  MoreVertical,
  Bell,
  AlertTriangle,
  FileWarning,
  ClipboardList,
  Wrench,
  Settings,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  item: FeedItem;
  currentUserId?: string;
  onMarkAsRead?: (itemId: string) => void;
  onMarkAsUnread?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onClick?: (item: FeedItem) => void;
}

export default function FeedCard({
  item,
  currentUserId,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onClick,
}: FeedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if current user has read this item
  const isRead = currentUserId
    ? item.feed_reads?.some((read) => read.user_id === currentUserId)
    : false;

  // Get feed type icon and color
  const getFeedTypeConfig = () => {
    switch (item.type) {
      case "task_delegated":
        return {
          icon: ClipboardList,
          label: "Task Assigned",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800",
          iconColor: "text-orange-600 dark:text-orange-400",
          badgeVariant: "default" as const,
        };
      case "pending_docs":
        return {
          icon: FileWarning,
          label: "Document Alert",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-200 dark:border-amber-800",
          iconColor: "text-amber-600 dark:text-amber-400",
          badgeVariant: "secondary" as const,
        };
      case "custom_note":
        return {
          icon: Bell,
          label: "Announcement",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800",
          iconColor: "text-orange-600 dark:text-orange-400",
          badgeVariant: "outline" as const,
        };
      case "maintenance":
        return {
          icon: Wrench,
          label: "Maintenance",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800",
          iconColor: "text-orange-600 dark:text-orange-400",
          badgeVariant: "secondary" as const,
        };
      case "system":
        return {
          icon: Settings,
          label: "System",
          bgColor: "bg-gray-50 dark:bg-gray-800",
          borderColor: "border-gray-200 dark:border-gray-700",
          iconColor: "text-gray-600 dark:text-gray-400",
          badgeVariant: "outline" as const,
        };
      default:
        return {
          icon: Bell,
          label: "Info",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800",
          iconColor: "text-orange-600 dark:text-orange-400",
          badgeVariant: "default" as const,
        };
    }
  };

  // Get priority styling
  const getPriorityConfig = () => {
    switch (item.priority) {
      case "critical":
        return {
          badge: "🔴 Critical",
          bgColor: "bg-red-50",
          borderColor: "border-red-300",
          textColor: "text-red-900",
        };
      case "high":
        return {
          badge: "🟡 High",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-300",
          textColor: "text-amber-900",
        };
      case "normal":
        return {
          badge: "Normal",
          bgColor: "",
          borderColor: "",
          textColor: "",
        };
      case "low":
        return {
          badge: "Low",
          bgColor: "",
          borderColor: "",
          textColor: "text-muted-foreground",
        };
      default:
        return {
          badge: "Normal",
          bgColor: "",
          borderColor: "",
          textColor: "",
        };
    }
  };

  const typeConfig = getFeedTypeConfig();
  const priorityConfig = getPriorityConfig();
  const TypeIcon = typeConfig.icon;

  // Determine if message should be truncated
  const shouldTruncate = item.message.length > 150;
  const displayMessage =
    shouldTruncate && !isExpanded
      ? item.message.substring(0, 150) + "..."
      : item.message;

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const creatorName = item.creator?.display_name || "System";
  const creatorAvatar = item.creator?.avatar_url;

  const canDelete =
    currentUserId &&
    (item.created_by === currentUserId || currentUserId === "admin");

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        !isRead && "border-l-4 border-l-primary",
        priorityConfig.bgColor,
        priorityConfig.borderColor && `border-2 ${priorityConfig.borderColor}`
      )}
      onClick={() => onClick?.(item)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon + Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Type Icon */}
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                typeConfig.bgColor,
                typeConfig.borderColor && `border ${typeConfig.borderColor}`
              )}
            >
              <TypeIcon className={cn("w-5 h-5", typeConfig.iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title + Badges */}
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <h3
                  className={cn(
                    "font-semibold text-base leading-tight",
                    priorityConfig.textColor
                  )}
                >
                  {item.title}
                </h3>
                {!isRead && (
                  <Badge variant="default" className="h-5 text-xs shrink-0">
                    New
                  </Badge>
                )}
              </div>

              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={typeConfig.badgeVariant} className="text-xs">
                  {typeConfig.label}
                </Badge>
                {item.priority !== "normal" && (
                  <Badge variant="outline" className="text-xs">
                    {priorityConfig.badge}
                  </Badge>
                )}
                {item.channel && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    #{item.channel}
                  </Badge>
                )}
              </div>

              {/* Creator + Timestamp */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={creatorAvatar} alt={creatorName} />
                  <AvatarFallback className="text-xs">
                    {getInitials(creatorName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{creatorName}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isRead && onMarkAsRead && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(item.id);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Read
                </DropdownMenuItem>
              )}
              {isRead && onMarkAsUnread && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsUnread(item.id);
                  }}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Mark as Unread
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm("Are you sure you want to delete this feed item?")
                    ) {
                      onDelete(item.id);
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Message */}
        <p
          className={cn(
            "text-sm whitespace-pre-wrap",
            priorityConfig.textColor || "text-foreground"
          )}
        >
          {displayMessage}
        </p>

        {/* Show more/less button */}
        {shouldTruncate && (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto mt-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}

        {/* Related Entity Link (if applicable) */}
        {item.related_entity_type && item.related_entity_id && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to related entity
                window.location.href = `/${item.related_entity_type}s/${item.related_entity_id}`;
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View {item.related_entity_type}
            </Button>
          </div>
        )}

        {/* Expiration warning */}
        {item.expires_at && new Date(item.expires_at) > new Date() && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3" />
            <span>
              Expires{" "}
              {formatDistanceToNow(new Date(item.expires_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
