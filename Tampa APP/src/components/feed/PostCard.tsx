/**
 * PostCard - Display individual feed posts
 * Shows author info, content, attachments, reactions, and comments
 */

import { useState } from 'react';
import { MoreVertical, ThumbsUp, MessageCircle, Pin, Trash2, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { deletePost, togglePinPost } from '@/lib/feed/feedService';
import { useReactions } from '@/lib/feed/feedHooks';
import type { FeedPost } from '@/lib/feed/feedService';
import ReactionPicker from './ReactionPicker';
import { CommentsList } from './CommentsList';

interface PostCardProps {
  post: FeedPost;
  currentUserId: string;
  organizationId: string;
  onUpdate: () => void;
}

export default function PostCard({ post, currentUserId, organizationId, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const { toggleReaction, reacting } = useReactions(post.id, currentUserId);

  // Check if current user has reacted
  const userReaction = post.reactions?.find(r => r.user_id === currentUserId);
  const isAuthor = post.author_id === currentUserId;

  const handleReaction = async (reactionType: string) => {
    await toggleReaction(reactionType, userReaction?.reaction_type);
    setShowReactionPicker(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(post.id);
      toast.success('Post deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handlePin = async () => {
    try {
      await togglePinPost(post.id, currentUserId);
      toast.success(post.is_pinned ? 'Post unpinned' : 'Post pinned to top');
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('Failed to update post');
    }
  };

  // Post type styling
  const postTypeStyles = {
    text: 'bg-white',
    announcement: 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500',
    alert: 'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500',
    celebration: 'bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500',
  };

  const postTypeIcons = {
    text: null,
    announcement: '📢',
    alert: '🚨',
    celebration: '🎉',
  };

  // Group reactions by type
  const reactionGroups = post.reactions?.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`rounded-lg shadow-sm border p-6 transition-shadow hover:shadow-md ${postTypeStyles[post.content_type]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-white">
              {post.author?.display_name?.charAt(0) || '?'}
            </span>
          </div>

          {/* Author Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.author?.display_name || 'Unknown'}</span>
              {postTypeIcons[post.content_type] && (
                <span className="text-sm">{postTypeIcons[post.content_type]}</span>
              )}
              {post.is_pinned && (
                <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />
              )}
            </div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              {post.edited_at && ' • Edited'}
            </div>
          </div>
        </div>

        {/* Menu */}
        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePin}>
                <Pin className="w-4 h-4 mr-2" />
                {post.is_pinned ? 'Unpin Post' : 'Pin Post'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="mb-4 whitespace-pre-wrap text-gray-800">
        {post.content}
      </div>

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {post.attachments.map((attachment) => (
            <div key={attachment.id} className="relative rounded overflow-hidden bg-gray-100">
              {attachment.file_type.startsWith('image/') ? (
                <img
                  src={attachment.storage_path}
                  alt={attachment.file_name}
                  className="w-full h-auto"
                  loading="lazy"
                />
              ) : (
                <div className="p-4 flex items-center gap-2">
                  <span className="text-sm truncate">{attachment.file_name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reactions Summary */}
      {(post.reaction_count > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between py-3 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            {reactionGroups && Object.entries(reactionGroups).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1">
                <span>{getReactionEmoji(type)}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
          {commentCount > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 py-3 border-t border-gray-200">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className={userReaction ? 'text-blue-600' : ''}
            disabled={reacting}
          >
            <ThumbsUp className={`w-4 h-4 mr-2 ${userReaction ? 'fill-current' : ''}`} />
            {userReaction ? 'Liked' : 'Like'}
          </Button>
          
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-2">
              <ReactionPicker
                onSelect={handleReaction}
                onClose={() => setShowReactionPicker(false)}
              />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Comment
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 pt-4 mt-2">
          <CommentsList
            postId={post.id}
            organizationId={organizationId}
            selectedUserId={currentUserId}
            onCommentCountChange={setCommentCount}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to get emoji for reaction type
function getReactionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    like: '👍',
    love: '❤️',
    celebrate: '🎉',
    support: '🙌',
    fire: '🔥',
    thumbs_up: '👍',
    clap: '👏',
    check: '✅',
    eyes: '👀',
    heart: '❤️',
  };
  return emojiMap[type] || '👍';
}
