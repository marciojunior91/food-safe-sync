/**
 * =====================================================
 * COMMENT ITEM - Single comment display
 * =====================================================
 * Features:
 * - Author info with avatar
 * - Timestamp
 * - Reply button
 * - Delete button (own comments only)
 * - Edit indicator
 * - Mentions highlighting
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { deleteComment } from '@/lib/feed/feedService';
import type { FeedComment } from '@/lib/feed/feedService';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: FeedComment;
  onReply?: () => void;
  onDelete?: () => void;
  isReply?: boolean;
}

export function CommentItem({ comment, onReply, onDelete, isReply }: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;

    try {
      setDeleting(true);
      await deleteComment(comment.id);
      toast({ title: 'Comment deleted' });
      onDelete?.();
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Highlight mentions in content
  const renderContent = (content: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add mention (highlighted)
      parts.push(
        <span key={match.index} className="text-primary font-medium">
          @{match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const authorName = comment.author?.display_name || 'Unknown User';
  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('group flex gap-3', isReply && 'text-sm')}>
      {/* Avatar */}
      <Avatar className={cn('h-8 w-8', isReply && 'h-6 w-6')}>
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {authorInitials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg px-3 py-2">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.edited_at && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {/* Comment text */}
          <div className="text-sm leading-relaxed break-words">
            {renderContent(comment.content)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1 px-2">
          {onReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onReply}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}

          {/* Delete option (only show for own comments) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-1 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
