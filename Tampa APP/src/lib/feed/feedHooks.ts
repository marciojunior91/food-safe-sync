/**
 * =====================================================
 * FEED MODULE - React Hooks
 * =====================================================
 * Custom hooks for Feed functionality
 * Version: 1.0
 * Created: January 17, 2026
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getFeedPosts,
  getPostComments,
  subscribeToPosts,
  subscribeToComments,
  addReaction,
  removeReaction,
  createPost,
  addComment,
  type FeedPost,
  type FeedComment,
  type CreatePostInput,
  type CreateCommentInput,
} from './feedService';

// =====================================================
// FEED POSTS HOOK
// =====================================================

export function useFeed(
  organizationId: string,
  filter: 'all' | 'pinned' | 'mentions' = 'all',
  currentUserId?: string
) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 20;

  // Load posts
  const loadPosts = useCallback(
    async (reset = false) => {
      console.log('[useFeed.loadPosts] 📞 Called with:', { 
        organizationId, 
        filter, 
        currentUserId, 
        reset, 
        offset: reset ? 0 : offset 
      });

      // Don't load if no organization ID
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const data = await getFeedPosts(organizationId, limit, currentOffset, filter, currentUserId);

        if (reset) {
          setPosts(data);
          setOffset(data.length);
        } else {
          setPosts(prev => [...prev, ...data]);
          setOffset(prev => prev + data.length);
        }

        setHasMore(data.length === limit);
      } catch (err) {
        console.error('Failed to load feed:', err);
        setError('Failed to load feed posts');
        toast.error('Failed to load feed posts');
      } finally {
        setLoading(false);
      }
    },
    [organizationId, filter, currentUserId, offset]
  );

  // Initial load
  useEffect(() => {
    loadPosts(true);
  }, [organizationId, filter, currentUserId]);

  // Real-time subscription
  useEffect(() => {
    const channel = subscribeToPosts(organizationId, {
      onInsert: (newPost) => {
        setPosts(prev => [newPost, ...prev]);
        toast.success('New post available');
      },
      onUpdate: (updatedPost) => {
        setPosts(prev =>
          prev.map(post => (post.id === updatedPost.id ? updatedPost : post))
        );
      },
      onDelete: (postId) => {
        setPosts(prev => prev.filter(post => post.id !== postId));
      },
    });

    return () => {
      channel.unsubscribe();
    };
  }, [organizationId]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  }, [loading, hasMore, loadPosts]);

  const refresh = useCallback(() => {
    loadPosts(true);
  }, [loadPosts]);

  return {
    posts,
    loading,
    error,
    loadMore,
    hasMore,
    refresh,
  };
}

// =====================================================
// POST COMMENTS HOOK
// =====================================================

export function usePostComments(postId: string) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPostComments(postId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments');
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Initial load
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Real-time subscription
  useEffect(() => {
    const channel = subscribeToComments(postId, (newComment) => {
      loadComments(); // Reload to maintain threading
      toast.success('New comment added');
    });

    return () => {
      channel.unsubscribe();
    };
  }, [postId, loadComments]);

  const refresh = useCallback(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    refresh,
  };
}

// =====================================================
// POST CREATION HOOK
// =====================================================

export function useCreatePost() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (postData: CreatePostInput) => {
    try {
      setCreating(true);
      setError(null);

      const post = await createPost(postData);
      toast.success('Post created successfully!');
      return post;
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post');
      toast.error('Failed to create post');
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return {
    create,
    creating,
    error,
  };
}

// =====================================================
// COMMENT CREATION HOOK
// =====================================================

export function useCreateComment() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (commentData: CreateCommentInput) => {
    try {
      setCreating(true);
      setError(null);

      const comment = await addComment(commentData);
      toast.success('Comment added!');
      return comment;
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
      toast.error('Failed to add comment');
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return {
    create,
    creating,
    error,
  };
}

// =====================================================
// REACTIONS HOOK
// =====================================================

export function useReactions(postId: string, currentUserId: string) {
  const [reacting, setReacting] = useState(false);

  const toggleReaction = useCallback(
    async (reactionType: string, currentReaction?: string) => {
      try {
        setReacting(true);

        if (currentReaction) {
          // Remove existing reaction first
          await removeReaction(postId, currentUserId);
        }

        // Add new reaction if different or no existing reaction
        if (!currentReaction || currentReaction !== reactionType) {
          await addReaction(postId, currentUserId, reactionType);
        }
      } catch (err) {
        console.error('Failed to toggle reaction:', err);
        toast.error('Failed to update reaction');
      } finally {
        setReacting(false);
      }
    },
    [postId, currentUserId]
  );

  const react = useCallback(
    async (reactionType: string) => {
      try {
        setReacting(true);
        await addReaction(postId, currentUserId, reactionType);
      } catch (err) {
        console.error('Failed to add reaction:', err);
        toast.error('Failed to add reaction');
      } finally {
        setReacting(false);
      }
    },
    [postId, currentUserId]
  );

  const unreact = useCallback(async () => {
    try {
      setReacting(true);
      await removeReaction(postId, currentUserId);
    } catch (err) {
      console.error('Failed to remove reaction:', err);
      toast.error('Failed to remove reaction');
    } finally {
      setReacting(false);
    }
  }, [postId, currentUserId]);

  return {
    toggleReaction,
    react,
    unreact,
    reacting,
  };
}

// =====================================================
// MENTION INPUT HOOK
// =====================================================

export function useMentionInput(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleChange = useCallback((newValue: string, cursor: number) => {
    setValue(newValue);
    setCursorPosition(cursor);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  }, []);

  const insertMention = useCallback(
    (userId: string, userName: string) => {
      const textBeforeCursor = value.substring(0, cursorPosition);
      const textAfterCursor = value.substring(cursorPosition);

      // Remove the @ and partial text
      const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
      const mention = `@[${userName}](${userId}) `;

      const newValue = beforeMention + mention + textAfterCursor;
      const newCursor = (beforeMention + mention).length;

      setValue(newValue);
      setCursorPosition(newCursor);
      setShowSuggestions(false);
      setMentionQuery('');

      return { value: newValue, cursor: newCursor };
    },
    [value, cursorPosition]
  );

  return {
    value,
    setValue,
    handleChange,
    showSuggestions,
    mentionQuery,
    insertMention,
  };
}
