/**
 * =====================================================
 * COMMENTS LIST - Display all comments for a post
 * =====================================================
 * Features:
 * - Nested/threaded comments
 * - Real-time updates
 * - Reply functionality
 * - Load more pagination
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import { getComments } from '@/lib/feed/feedService';
import type { FeedComment } from '@/lib/feed/feedService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommentsListProps {
  postId: string;
  organizationId: string;
  selectedUserId: string; // Team member ID of current user
  onCommentCountChange?: (count: number) => void;
}

export function CommentsList({
  postId,
  organizationId,
  selectedUserId,
  onCommentCountChange,
}: CommentsListProps) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  // Load comments
  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(postId);
      setComments(data);
      onCommentCountChange?.(data.length);
    } catch (error: any) {
      console.error('Failed to load comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadComments();
  }, [postId]);

  // Real-time subscriptions
  useEffect(() => {
    console.log('[CommentsList] Setting up real-time subscription for post:', postId);

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('[CommentsList] Real-time event:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new comment
            const newComment = payload.new as FeedComment;
            setComments((prev) => [...prev, newComment]);
            onCommentCountChange?.(comments.length + 1);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing comment
            setComments((prev) =>
              prev.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } : c))
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted comment
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
            onCommentCountChange?.(comments.length - 1);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[CommentsList] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [postId]);

  // Handle new comment success
  const handleCommentSuccess = () => {
    setReplyingTo(null);
    loadComments(); // Reload to get full data with author info
  };

  // Organize comments into threads (top-level + replies)
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (commentId: string) =>
    comments.filter((c) => c.parent_comment_id === commentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600 dark:text-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main comment composer */}
      <CommentComposer
        postId={postId}
        organizationId={organizationId}
        authorId={selectedUserId}
        onSuccess={handleCommentSuccess}
        placeholder="Write a comment..."
      />

      {/* Comments list */}
      {topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <CommentItem
                comment={comment}
                onReply={() => setReplyingTo(comment.id)}
                onDelete={loadComments}
              />

              {/* Reply composer (if replying to this comment) */}
              {replyingTo === comment.id && (
                <div className="ml-12 mt-2">
                  <CommentComposer
                    postId={postId}
                    organizationId={organizationId}
                    authorId={selectedUserId}
                    parentCommentId={comment.id}
                    onSuccess={handleCommentSuccess}
                    onCancel={() => setReplyingTo(null)}
                    placeholder={`Reply to ${comment.author?.display_name || 'comment'}...`}
                  />
                </div>
              )}

              {/* Nested replies */}
              {getReplies(comment.id).length > 0 && (
                <div className="ml-12 mt-3 space-y-3 border-l-2 border-orange-200 dark:border-orange-800 pl-4">
                  {getReplies(comment.id).map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onReply={() => setReplyingTo(comment.id)} // Reply to parent
                      onDelete={loadComments}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
