/**
 * =====================================================
 * FEED MODULE - Backend Service Layer
 * =====================================================
 * Complete API for Feed posts, comments, reactions, mentions
 * Version: 1.0
 * Created: January 17, 2026
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface FeedPost {
  id: string;
  organization_id: string;
  author_id: string;
  content: string;
  content_type: 'text' | 'announcement' | 'alert' | 'celebration';
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  
  // Joined data
  author?: {
    id: string;
    display_name: string;
    email?: string;
  };
  reactions?: FeedReaction[];
  comments?: FeedComment[];
  attachments?: FeedAttachment[];
}

export interface FeedReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
  user?: {
    id: string;
    display_name: string;
  };
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  author?: {
    id: string;
    display_name: string;
    email?: string;
  };
  replies?: FeedComment[];
}

export interface FeedAttachment {
  id: string;
  post_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  uploaded_at: string;
  uploaded_by: string;
}

export interface FeedMention {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  mentioned_user_id: string;
  mentioned_by_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface CreatePostInput {
  organization_id: string;
  author_id: string;
  content: string;
  content_type?: 'text' | 'announcement' | 'alert' | 'celebration';
}

export interface CreateCommentInput {
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id?: string | null;
}

// =====================================================
// FEED POSTS
// =====================================================

/**
 * Get paginated feed posts for an organization
 */
export async function getFeedPosts(
  organizationId: string,
  limit = 20,
  offset = 0,
  filter?: 'all' | 'pinned' | 'mentions',
  currentUserId?: string
) {
  let query = supabase
    .from('feed_posts')
    .select(`
      *,
      author:team_members!author_id(id, display_name, email),
      attachments:feed_attachments(*),
      reactions:feed_reactions(
        id, 
        reaction_type, 
        user_id,
        user:team_members!user_id(id, display_name)
      )
    `)
    .eq('organization_id', organizationId);

  // Apply filters
  if (filter === 'pinned') {
    query = query.eq('is_pinned', true);
  } else if (filter === 'mentions' && currentUserId) {
    console.log('[getFeedPosts] 🔍 Mentions filter activated for user:', currentUserId);
    
    // Get post IDs where user is mentioned (in post or comments)
    const { data: mentions, error: mentionsError } = await supabase
      .from('feed_mentions')
      .select('post_id, comment_id')
      .eq('mentioned_user_id', currentUserId);
    
    console.log('[getFeedPosts] 📋 Found mentions:', mentions?.length || 0);
    console.log('[getFeedPosts] 📋 Mentions data:', mentions);
    console.log('[getFeedPosts] 🔍 Mentions error:', mentionsError);
    
    if (mentionsError) {
      console.error('[getFeedPosts] ❌ Error fetching mentions:', mentionsError);
      console.error('[getFeedPosts] ❌ Error details:', JSON.stringify(mentionsError, null, 2));
    }
    
    if (mentions && mentions.length > 0) {
      // Extract unique post IDs (from direct mentions or comment mentions)
      const postIds = new Set<string>();
      
      for (const mention of mentions) {
        if (mention.post_id) {
          console.log('[getFeedPosts] ➕ Adding post from direct mention:', mention.post_id);
          postIds.add(mention.post_id);
        } else if (mention.comment_id) {
          console.log('[getFeedPosts] 🔍 Getting post from comment:', mention.comment_id);
          // Get post_id from comment
          const { data: comment, error: commentError } = await supabase
            .from('feed_comments')
            .select('post_id')
            .eq('id', mention.comment_id)
            .single();
          
          if (commentError) {
            console.error('[getFeedPosts] ❌ Error fetching comment:', commentError);
          }
          
          if (comment?.post_id) {
            console.log('[getFeedPosts] ➕ Adding post from comment mention:', comment.post_id);
            postIds.add(comment.post_id);
          }
        }
      }
      
      console.log('[getFeedPosts] 📦 Total unique post IDs:', postIds.size);
      console.log('[getFeedPosts] 📦 Post IDs:', Array.from(postIds));
      
      if (postIds.size > 0) {
        query = query.in('id', Array.from(postIds));
      } else {
        // No mentions found, return empty
        console.log('[getFeedPosts] ⚠️ No valid post IDs found, returning empty');
        return [];
      }
    } else {
      // No mentions found, return empty
      console.log('[getFeedPosts] ⚠️ No mentions found for user, returning empty');
      return [];
    }
  }

  // Order: pinned first, then by creation date
  query = query
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  console.log('[getFeedPosts] 🎯 Final query executing for filter:', filter);
  console.log('[getFeedPosts] 🎯 Organization:', organizationId);
  console.log('[getFeedPosts] 🎯 User:', currentUserId);

  const { data, error } = await query;
  
  console.log('[getFeedPosts] 📦 Query returned:', data?.length || 0, 'posts');
  if (error) {
    console.error('[getFeedPosts] ❌ Query error:', error);
  }

  if (error) throw error;
  return data as FeedPost[];
}

/**
 * Get a single post by ID with all details
 */
export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select(`
      *,
      author:team_members!author_id(id, display_name, email),
      attachments:feed_attachments(*),
      reactions:feed_reactions(
        id, 
        reaction_type, 
        user_id,
        user:team_members!user_id(id, display_name)
      )
    `)
    .eq('id', postId)
    .single();

  if (error) throw error;
  return data as FeedPost;
}

/**
 * Create a new feed post
 */
export async function createPost(post: CreatePostInput) {
  const insertData = {
    organization_id: post.organization_id,
    author_id: post.author_id,
    content: post.content,
    content_type: post.content_type || 'text',
  };
  
  console.log('[feedService.createPost] Inserting data:', insertData);
  console.log('[feedService.createPost] Auth session:', await supabase.auth.getSession());
  
  const { data, error } = await supabase
    .from('feed_posts')
    .insert(insertData)
    .select(`
      *,
      author:team_members!author_id(id, display_name, email)
    `)
    .single();

  if (error) {
    console.error('[feedService.createPost] Error:', error);
    throw error;
  }
  
  console.log('[feedService.createPost] Success:', data);
  return data as FeedPost;
}

/**
 * Update an existing post (only content can be edited)
 */
export async function updatePost(postId: string, content: string) {
  const { data, error } = await supabase
    .from('feed_posts')
    .update({ content })
    .eq('id', postId)
    .select(`
      *,
      author:team_members!author_id(id, display_name, email)
    `)
    .single();

  if (error) throw error;
  return data as FeedPost;
}

/**
 * Delete a post (cascade deletes comments, reactions, attachments)
 */
export async function deletePost(postId: string) {
  const { error } = await supabase
    .from('feed_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

/**
 * Toggle pin status of a post
 */
export async function togglePinPost(postId: string, userId: string) {
  // Get current pin status
  const { data: post } = await supabase
    .from('feed_posts')
    .select('is_pinned')
    .eq('id', postId)
    .single();

  const newPinStatus = !post?.is_pinned;

  const { data, error } = await supabase
    .from('feed_posts')
    .update({
      is_pinned: newPinStatus,
      pinned_at: newPinStatus ? new Date().toISOString() : null,
      pinned_by: newPinStatus ? userId : null,
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// REACTIONS
// =====================================================

/**
 * Add a reaction to a post (or update if already exists)
 */
export async function addReaction(
  postId: string,
  userId: string,
  reactionType: string
) {
  const { data, error } = await supabase
    .from('feed_reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType,
    })
    .select(`
      *,
      user:team_members!user_id(id, display_name)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a user's reaction from a post
 */
export async function removeReaction(postId: string, userId: string) {
  const { error } = await supabase
    .from('feed_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get all reactions for a post
 */
export async function getPostReactions(postId: string) {
  const { data, error } = await supabase
    .from('feed_reactions')
    .select(`
      *,
      user:team_members!user_id(id, display_name)
    `)
    .eq('post_id', postId);

  if (error) throw error;
  return data as FeedReaction[];
}

// =====================================================
// COMMENTS
// =====================================================

/**
 * Get all comments for a post (with threading support)
 */
export async function getPostComments(postId: string) {
  const { data, error } = await supabase
    .from('feed_comments')
    .select(`
      *,
      author:team_members!author_id(id, display_name, email)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Return flat list for CommentsList to handle threading
  return data as FeedComment[];
}

// Alias for convenience
export const getComments = getPostComments;

/**
 * Add a comment to a post
 */
export async function addComment(comment: CreateCommentInput) {
  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      post_id: comment.post_id,
      author_id: comment.author_id,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id || null,
    })
    .select(`
      *,
      author:team_members!author_id(id, display_name, email)
    `)
    .single();

  if (error) throw error;
  return data as FeedComment;
}

// Alias for convenience
export const createComment = addComment;

/**
 * Update a comment's content
 */
export async function updateComment(commentId: string, content: string) {
  const { data, error } = await supabase
    .from('feed_comments')
    .update({ content })
    .eq('id', commentId)
    .select(`
      *,
      author:team_members!author_id(id, display_name, email)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('feed_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

// =====================================================
// ATTACHMENTS
// =====================================================

/**
 * Upload a file attachment to a post
 */
export async function uploadAttachment(
  file: File,
  postId: string,
  userId: string,
  organizationId: string
) {
  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${organizationId}/${postId}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('feed-attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Save metadata to database
  const { data, error } = await supabase
    .from('feed_attachments')
    .insert({
      post_id: postId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FeedAttachment;
}

/**
 * Get public URL for an attachment
 */
export async function getAttachmentUrl(storagePath: string) {
  const { data } = supabase.storage
    .from('feed-attachments')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(attachmentId: string, storagePath: string) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('feed-attachments')
    .remove([storagePath]);

  if (storageError) console.error('Storage delete error:', storageError);

  // Delete from database
  const { error } = await supabase
    .from('feed_attachments')
    .delete()
    .eq('id', attachmentId);

  if (error) throw error;
}

// =====================================================
// MENTIONS
// =====================================================

/**
 * Extract @mentions from content and create mention records
 * Format: @[Display Name](user_id)
 */
export async function createMentions(
  content: string,
  postId: string | null,
  commentId: string | null,
  mentionedById: string
) {
  console.log('[createMentions] 📝 Content:', content);
  console.log('[createMentions] 📌 Post ID:', postId);
  console.log('[createMentions] 💬 Comment ID:', commentId);
  console.log('[createMentions] 👤 Mentioned by ID:', mentionedById);
  
  // Extract @mentions using regex: @[Name](id)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    console.log('[createMentions] 🎯 Found mention:', match[1], '→ ID:', match[2]);
    mentions.push(match[2]); // Extract user_id
  }

  console.log('[createMentions] 📋 Total mentions extracted:', mentions.length);

  if (mentions.length === 0) {
    console.log('[createMentions] ⚠️ No mentions found in content');
    return;
  }

  // Create mention records
  // CRITICAL FIX: Either post_id OR comment_id, NOT BOTH (constraint: mention_target_check)
  const mentionRecords = mentions.map(userId => ({
    post_id: commentId ? null : postId, // If comment exists, set post_id to null
    comment_id: commentId,
    mentioned_user_id: userId,
    mentioned_by_id: mentionedById,
  }));

  console.log('[createMentions] 💾 Inserting records:', mentionRecords);

  const { error } = await supabase
    .from('feed_mentions')
    .insert(mentionRecords);

  if (error) {
    console.error('[createMentions] ❌ Error inserting mentions:', error);
    console.error('[createMentions] ❌ Mention records:', mentionRecords);
    throw error;
  }
  
  console.log(`[createMentions] ✅ Created ${mentions.length} mention(s) successfully`);
}

/**
 * Get all mentions for a user
 */
export async function getUserMentions(userId: string, unreadOnly = false) {
  let query = supabase
    .from('feed_mentions')
    .select(`
      *,
      post:feed_posts(*),
      comment:feed_comments(*),
      mentioned_by:team_members!mentioned_by_id(id, display_name, email)
    `)
    .eq('mentioned_user_id', userId)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Mark a mention as read
 */
export async function markMentionAsRead(mentionId: string) {
  const { error } = await supabase
    .from('feed_mentions')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', mentionId);

  if (error) throw error;
}

/**
 * Mark all mentions for a user as read
 */
export async function markAllMentionsAsRead(userId: string) {
  const { error } = await supabase
    .from('feed_mentions')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('mentioned_user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to real-time post changes for an organization
 */
export function subscribeToPosts(
  organizationId: string,
  callbacks: {
    onInsert?: (post: FeedPost) => void;
    onUpdate?: (post: FeedPost) => void;
    onDelete?: (postId: string) => void;
  }
) {
  const channel = supabase.channel('feed-posts');

  if (callbacks.onInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_posts',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => callbacks.onInsert!(payload.new as FeedPost)
    );
  }

  if (callbacks.onUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'feed_posts',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => callbacks.onUpdate!(payload.new as FeedPost)
    );
  }

  if (callbacks.onDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'feed_posts',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => callbacks.onDelete!(payload.old.id)
    );
  }

  channel.subscribe();

  return channel;
}

/**
 * Subscribe to comment changes for a post
 */
export function subscribeToComments(
  postId: string,
  onComment: (comment: FeedComment) => void
) {
  return supabase
    .channel(`comments-${postId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_comments',
        filter: `post_id=eq.${postId}`,
      },
      (payload) => onComment(payload.new as FeedComment)
    )
    .subscribe();
}

/**
 * Subscribe to reactions for a post
 */
export function subscribeToReactions(
  postId: string,
  callbacks: {
    onAdd?: (reaction: FeedReaction) => void;
    onRemove?: (reactionId: string) => void;
  }
) {
  const channel = supabase.channel(`reactions-${postId}`);

  if (callbacks.onAdd) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_reactions',
        filter: `post_id=eq.${postId}`,
      },
      (payload) => callbacks.onAdd!(payload.new as FeedReaction)
    );
  }

  if (callbacks.onRemove) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'feed_reactions',
        filter: `post_id=eq.${postId}`,
      },
      (payload) => callbacks.onRemove!(payload.old.id)
    );
  }

  channel.subscribe();

  return channel;
}
