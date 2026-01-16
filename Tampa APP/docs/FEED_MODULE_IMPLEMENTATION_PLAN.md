# 🗣️ FEED MODULE - Complete Implementation Plan

**Priority:** 🟠 HIGH  
**Status:** 🚧 Not Started (0%)  
**Estimated Time:** 2-3 weeks  
**Start Date:** January 15, 2026  
**Target Completion:** February 5, 2026

---

## 🎯 MODULE OVERVIEW

The Feed Module is a **social collaboration hub** where team members can:
- 📝 Share updates, observations, and important information
- 💬 Comment and discuss posts
- 👍 React with emojis
- 📎 Attach photos, documents, and files
- @️ Mention team members for notifications
- 📌 Pin important posts
- 🔔 Receive real-time notifications

**Business Value:**
- Improves team communication
- Centralizes operational updates
- Replaces WhatsApp/SMS for work communications
- Creates searchable history of events
- Enhances team collaboration and transparency

---

## 📋 DEVELOPMENT PHASES

### **PHASE 1: Database Setup** (Days 1-2)
- Create tables
- Setup RLS policies
- Create indexes
- Test data insertion

### **PHASE 2: Backend Features** (Days 3-5)
- Edge functions
- Real-time subscriptions
- File upload system
- Notification system

### **PHASE 3: Frontend Implementation** (Days 6-12)
- UI components
- Post composer
- Feed timeline
- Comments & reactions
- Mentions system

### **PHASE 4: Polish & Testing** (Days 13-14)
- Performance optimization
- Mobile responsive
- Edge cases
- User testing

---

## 🗄️ PHASE 1: DATABASE SETUP

### **Step 1.1: Create Tables**

Create file: `supabase/migrations/20260115000003_feed_module.sql`

```sql
-- =====================================================
-- FEED MODULE - Complete Database Schema
-- =====================================================
-- Version: 1.0
-- Created: January 15, 2026
-- Description: Social feed with posts, comments, reactions, mentions, attachments

-- =====================================================
-- TABLE: feed_posts
-- =====================================================
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'announcement', 'alert', 'celebration')),
  
  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES team_members(id),
  
  -- Engagement
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT valid_content_length CHECK (char_length(content) <= 5000)
);

-- Indexes for performance
CREATE INDEX idx_feed_posts_org_created ON feed_posts(organization_id, created_at DESC);
CREATE INDEX idx_feed_posts_author ON feed_posts(author_id);
CREATE INDEX idx_feed_posts_pinned ON feed_posts(organization_id, is_pinned, pinned_at DESC) WHERE is_pinned = true;

-- =====================================================
-- TABLE: feed_reactions
-- =====================================================
CREATE TABLE IF NOT EXISTS feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  -- Reaction type (emoji)
  reaction_type VARCHAR(50) NOT NULL CHECK (reaction_type IN (
    'like', 'love', 'celebrate', 'support', 'fire', 
    'thumbs_up', 'clap', 'check', 'eyes', 'heart'
  )),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One reaction per user per post
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_feed_reactions_post ON feed_reactions(post_id);
CREATE INDEX idx_feed_reactions_user ON feed_reactions(user_id);

-- =====================================================
-- TABLE: feed_comments
-- =====================================================
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  -- Threading support
  parent_comment_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX idx_feed_comments_post ON feed_comments(post_id, created_at ASC);
CREATE INDEX idx_feed_comments_author ON feed_comments(author_id);
CREATE INDEX idx_feed_comments_parent ON feed_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- =====================================================
-- TABLE: feed_mentions
-- =====================================================
CREATE TABLE IF NOT EXISTS feed_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  mentioned_by_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Either post or comment, not both
  CONSTRAINT mention_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_feed_mentions_user ON feed_mentions(mentioned_user_id, is_read, created_at DESC);
CREATE INDEX idx_feed_mentions_post ON feed_mentions(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_feed_mentions_comment ON feed_mentions(comment_id) WHERE comment_id IS NOT NULL;

-- =====================================================
-- TABLE: feed_attachments
-- =====================================================
CREATE TABLE IF NOT EXISTS feed_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  
  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Metadata for images
  thumbnail_path TEXT,
  width INTEGER,
  height INTEGER,
  
  -- Timestamp
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES team_members(id)
);

CREATE INDEX idx_feed_attachments_post ON feed_attachments(post_id);

-- =====================================================
-- TRIGGERS: Auto-update timestamps
-- =====================================================

-- Update post updated_at
CREATE OR REPLACE FUNCTION update_feed_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.content != NEW.content THEN
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feed_post_timestamp
  BEFORE UPDATE ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_post_timestamp();

-- Update comment updated_at
CREATE OR REPLACE FUNCTION update_feed_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.content != NEW.content THEN
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feed_comment_timestamp
  BEFORE UPDATE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_comment_timestamp();

-- =====================================================
-- TRIGGERS: Auto-update counters
-- =====================================================

-- Update reaction count
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts 
    SET reaction_count = reaction_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts 
    SET reaction_count = GREATEST(0, reaction_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_reaction_count_insert
  AFTER INSERT ON feed_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reaction_count();

CREATE TRIGGER trigger_update_post_reaction_count_delete
  AFTER DELETE ON feed_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reaction_count();

-- Update comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts 
    SET comment_count = GREATEST(0, comment_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comment_count_insert
  AFTER INSERT ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

CREATE TRIGGER trigger_update_post_comment_count_delete
  AFTER DELETE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- =====================================================
-- RLS POLICIES: Organization Isolation
-- =====================================================

-- Enable RLS
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_attachments ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can view posts in their organization"
  ON feed_posts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts in their organization"
  ON feed_posts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE id = auth.uid()
    )
    AND author_id = auth.uid()
  );

CREATE POLICY "Authors can update their own posts"
  ON feed_posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their own posts"
  ON feed_posts FOR DELETE
  USING (author_id = auth.uid());

-- Reactions policies
CREATE POLICY "Users can view reactions on posts they can see"
  ON feed_reactions FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM feed_posts 
      WHERE organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add reactions"
  ON feed_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own reactions"
  ON feed_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Users can view comments on posts they can see"
  ON feed_comments FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM feed_posts 
      WHERE organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments"
  ON feed_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own comments"
  ON feed_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their own comments"
  ON feed_comments FOR DELETE
  USING (author_id = auth.uid());

-- Mentions policies
CREATE POLICY "Users can view their own mentions"
  ON feed_mentions FOR SELECT
  USING (mentioned_user_id = auth.uid());

CREATE POLICY "Users can create mentions"
  ON feed_mentions FOR INSERT
  WITH CHECK (mentioned_by_id = auth.uid());

CREATE POLICY "Users can mark their mentions as read"
  ON feed_mentions FOR UPDATE
  USING (mentioned_user_id = auth.uid());

-- Attachments policies
CREATE POLICY "Users can view attachments on posts they can see"
  ON feed_attachments FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM feed_posts 
      WHERE organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload attachments"
  ON feed_attachments FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Uploaders can delete their attachments"
  ON feed_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE feed_posts IS 'Main feed posts with content and metadata';
COMMENT ON TABLE feed_reactions IS 'Emoji reactions on posts';
COMMENT ON TABLE feed_comments IS 'Comments and replies on posts';
COMMENT ON TABLE feed_mentions IS 'User mentions in posts and comments';
COMMENT ON TABLE feed_attachments IS 'Files attached to posts';

COMMENT ON COLUMN feed_posts.content_type IS 'Post type: text, announcement, alert, celebration';
COMMENT ON COLUMN feed_posts.is_pinned IS 'Whether post is pinned to top of feed';
COMMENT ON COLUMN feed_reactions.reaction_type IS 'Emoji type: like, love, celebrate, etc.';
COMMENT ON COLUMN feed_comments.parent_comment_id IS 'For threaded replies';
```

### **Step 1.2: Apply Migration**

Run in Supabase SQL Editor:
1. Copy the entire migration file above
2. Paste in SQL Editor
3. Execute
4. Verify tables created

### **Step 1.3: Verification Queries**

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'feed_%'
ORDER BY table_name;

-- Expected output:
-- feed_attachments
-- feed_comments
-- feed_mentions
-- feed_posts
-- feed_reactions

-- Check triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%feed%';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE 'feed_%'
ORDER BY tablename, indexname;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'feed_%';
```

---

## 🔧 PHASE 2: BACKEND FEATURES

### **Step 2.1: Create Storage Bucket**

In Supabase Dashboard → Storage:

1. Create bucket: `feed-attachments`
2. Settings:
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: `image/*`, `application/pdf`, `video/*`

3. Add RLS policies:

```sql
-- Storage policies for feed-attachments bucket
CREATE POLICY "Users can upload to their org feed"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feed-attachments'
  AND auth.uid() IN (
    SELECT id FROM team_members
  )
);

CREATE POLICY "Users can view their org feed attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'feed-attachments'
  AND auth.uid() IN (
    SELECT id FROM team_members
  )
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feed-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### **Step 2.2: Create Utility Functions**

File: `src/lib/feed/feedService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import type { UUID } from '@/types';

export interface FeedPost {
  id: UUID;
  organization_id: UUID;
  author_id: UUID;
  content: string;
  content_type: 'text' | 'announcement' | 'alert' | 'celebration';
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: UUID | null;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  
  // Joined data
  author?: {
    id: UUID;
    name: string;
    photo_url?: string;
  };
  reactions?: FeedReaction[];
  comments?: FeedComment[];
  attachments?: FeedAttachment[];
}

export interface FeedReaction {
  id: UUID;
  post_id: UUID;
  user_id: UUID;
  reaction_type: string;
  created_at: string;
  user?: {
    id: UUID;
    name: string;
  };
}

export interface FeedComment {
  id: UUID;
  post_id: UUID;
  author_id: UUID;
  parent_comment_id: UUID | null;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  author?: {
    id: UUID;
    name: string;
    photo_url?: string;
  };
  replies?: FeedComment[];
}

export interface FeedAttachment {
  id: UUID;
  post_id: UUID;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  uploaded_at: string;
  uploaded_by: UUID;
}

export interface FeedMention {
  id: UUID;
  post_id: UUID | null;
  comment_id: UUID | null;
  mentioned_user_id: UUID;
  mentioned_by_id: UUID;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// =====================================================
// FEED POSTS
// =====================================================

export async function getFeedPosts(organizationId: UUID, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select(`
      *,
      author:team_members!author_id(id, name, photo_url),
      attachments:feed_attachments(*),
      reactions:feed_reactions(
        id, 
        reaction_type, 
        user:team_members!user_id(id, name)
      )
    `)
    .eq('organization_id', organizationId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data as FeedPost[];
}

export async function createPost(post: {
  organization_id: UUID;
  author_id: UUID;
  content: string;
  content_type?: string;
}) {
  const { data, error } = await supabase
    .from('feed_posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data as FeedPost;
}

export async function updatePost(postId: UUID, content: string) {
  const { data, error } = await supabase
    .from('feed_posts')
    .update({ content })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as FeedPost;
}

export async function deletePost(postId: UUID) {
  const { error } = await supabase
    .from('feed_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

export async function togglePinPost(postId: UUID, userId: UUID) {
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

export async function addReaction(postId: UUID, userId: UUID, reactionType: string) {
  const { data, error } = await supabase
    .from('feed_reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeReaction(postId: UUID, userId: UUID) {
  const { error } = await supabase
    .from('feed_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;
}

// =====================================================
// COMMENTS
// =====================================================

export async function getPostComments(postId: UUID) {
  const { data, error } = await supabase
    .from('feed_comments')
    .select(`
      *,
      author:team_members!author_id(id, name, photo_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as FeedComment[];
}

export async function addComment(comment: {
  post_id: UUID;
  author_id: UUID;
  content: string;
  parent_comment_id?: UUID | null;
}) {
  const { data, error } = await supabase
    .from('feed_comments')
    .insert(comment)
    .select(`
      *,
      author:team_members!author_id(id, name, photo_url)
    `)
    .single();

  if (error) throw error;
  return data as FeedComment;
}

export async function updateComment(commentId: UUID, content: string) {
  const { data, error } = await supabase
    .from('feed_comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: UUID) {
  const { error } = await supabase
    .from('feed_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

// =====================================================
// ATTACHMENTS
// =====================================================

export async function uploadAttachment(
  file: File,
  postId: UUID,
  userId: UUID,
  organizationId: UUID
) {
  // Upload to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${organizationId}/${postId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('feed-attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Save metadata
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
  return data;
}

export async function getAttachmentUrl(storagePath: string) {
  const { data } = supabase.storage
    .from('feed-attachments')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

// =====================================================
// MENTIONS
// =====================================================

export async function createMentions(
  content: string,
  postId: UUID | null,
  commentId: UUID | null,
  mentionedById: UUID
) {
  // Extract @mentions from content
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: UUID[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2] as UUID);
  }

  if (mentions.length === 0) return;

  // Create mention records
  const mentionRecords = mentions.map(userId => ({
    post_id: postId,
    comment_id: commentId,
    mentioned_user_id: userId,
    mentioned_by_id: mentionedById,
  }));

  const { error } = await supabase
    .from('feed_mentions')
    .insert(mentionRecords);

  if (error) throw error;
}

export async function getUserMentions(userId: UUID, unreadOnly = false) {
  let query = supabase
    .from('feed_mentions')
    .select(`
      *,
      post:feed_posts(*),
      comment:feed_comments(*),
      mentioned_by:team_members!mentioned_by_id(id, name, photo_url)
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

export async function markMentionAsRead(mentionId: UUID) {
  const { error } = await supabase
    .from('feed_mentions')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', mentionId);

  if (error) throw error;
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export function subscribeToPosts(
  organizationId: UUID,
  onInsert: (post: FeedPost) => void,
  onUpdate: (post: FeedPost) => void,
  onDelete: (postId: UUID) => void
) {
  return supabase
    .channel('feed-posts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_posts',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => onInsert(payload.new as FeedPost)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'feed_posts',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => onUpdate(payload.new as FeedPost)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'feed_posts',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => onDelete(payload.old.id)
    )
    .subscribe();
}
```

---

## 🎨 PHASE 3: FRONTEND IMPLEMENTATION

### **Step 3.1: Create Base Components**

#### **File Structure:**
```
src/
  components/
    feed/
      FeedPage.tsx              # Main feed page container
      PostComposer.tsx          # Create new post
      PostCard.tsx              # Individual post display
      PostMenu.tsx              # Post actions menu
      ReactionPicker.tsx        # Emoji reaction selector
      ReactionBar.tsx           # Display reactions count
      CommentsList.tsx          # Comments section
      CommentItem.tsx           # Single comment
      CommentComposer.tsx       # Write comment
      MentionInput.tsx          # @mention autocomplete
      AttachmentUploader.tsx    # File upload component
      AttachmentPreview.tsx     # Display attachments
      FeedFilters.tsx           # Filter posts (all/pinned/mentions)
      EmptyState.tsx            # No posts placeholder
  lib/
    feed/
      feedService.ts            # API calls (already created)
      feedHooks.ts              # Custom React hooks
      feedUtils.ts              # Helper functions
```

---

### **Step 3.2: FeedPage.tsx - Main Container**

```typescript
import { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import FeedFilters from './FeedFilters';
import EmptyState from './EmptyState';
import { useFeed } from '@/lib/feed/feedHooks';
import { useAuth } from '@/hooks/useAuth';

export default function FeedPage() {
  const { user, organization } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pinned' | 'mentions'>('all');
  
  const {
    posts,
    loading,
    error,
    loadMore,
    hasMore,
    refresh
  } = useFeed(organization.id, filter);

  // Real-time subscription
  useEffect(() => {
    const subscription = subscribeToPosts(
      organization.id,
      (newPost) => {
        // Add new post to top
        refresh();
      },
      (updatedPost) => {
        // Update existing post
        refresh();
      },
      (deletedPostId) => {
        // Remove deleted post
        refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [organization.id]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading feed</p>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Feed</h1>
          <p className="text-gray-600 mt-1">
            Share updates and collaborate with your team
          </p>
        </div>
        <FeedFilters filter={filter} onFilterChange={setFilter} />
      </div>

      {/* Post Composer */}
      {!showComposer ? (
        <button
          onClick={() => setShowComposer(true)}
          className="w-full bg-white border-2 border-gray-200 rounded-lg p-4 mb-6 text-left hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {user.photo_url ? (
                <img src={user.photo_url} className="w-10 h-10 rounded-full" />
              ) : (
                <span className="text-lg font-semibold">
                  {user.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-gray-500">
              What's happening in your kitchen?
            </span>
          </div>
        </button>
      ) : (
        <PostComposer
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setShowComposer(false);
            refresh();
          }}
        />
      )}

      {/* Feed Content */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <>
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onUpdate={refresh}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                onClick={loadMore}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load More Posts'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

### **Step 3.3: PostComposer.tsx - Create Posts**

```typescript
import { useState, useRef } from 'react';
import { X, Image, Smile, AtSign, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { createPost, uploadAttachment } from '@/lib/feed/feedService';
import MentionInput from './MentionInput';
import AttachmentUploader from './AttachmentUploader';
import EmojiPicker from './EmojiPicker';

interface PostComposerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostComposer({ onClose, onSuccess }: PostComposerProps) {
  const { user, organization } = useAuth();
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'text' | 'announcement' | 'alert' | 'celebration'>('text');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const maxLength = 5000;
  const remaining = maxLength - content.length;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setUploading(true);
    setError('');

    try {
      // Create post
      const newPost = await createPost({
        organization_id: organization.id,
        author_id: user.id,
        content: content.trim(),
        content_type: contentType,
      });

      // Upload attachments
      for (const file of attachments) {
        await uploadAttachment(file, newPost.id, user.id, organization.id);
      }

      // Extract and create mentions
      await createMentions(content, newPost.id, null, user.id);

      onSuccess();
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Create Post</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Post Type Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setContentType('text')}
          className={`px-3 py-1 rounded-full text-sm ${
            contentType === 'text'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📝 Text
        </button>
        <button
          onClick={() => setContentType('announcement')}
          className={`px-3 py-1 rounded-full text-sm ${
            contentType === 'announcement'
              ? 'bg-blue-200 text-blue-800'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        >
          📢 Announcement
        </button>
        <button
          onClick={() => setContentType('alert')}
          className={`px-3 py-1 rounded-full text-sm ${
            contentType === 'alert'
              ? 'bg-red-200 text-red-800'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          }`}
        >
          🚨 Alert
        </button>
        <button
          onClick={() => setContentType('celebration')}
          className={`px-3 py-1 rounded-full text-sm ${
            contentType === 'celebration'
              ? 'bg-green-200 text-green-800'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
        >
          🎉 Celebration
        </button>
      </div>

      {/* Content Input */}
      <MentionInput
        value={content}
        onChange={setContent}
        placeholder="Share updates, ask questions, or celebrate wins with your team..."
        maxLength={maxLength}
        className="min-h-32 mb-2"
      />

      {/* Character Counter */}
      <div className={`text-sm text-right mb-4 ${
        remaining < 100 ? 'text-orange-600' : 'text-gray-500'
      }`}>
        {remaining} / {maxLength}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <AttachmentUploader
          files={attachments}
          onRemove={(index) => {
            setAttachments(prev => prev.filter((_, i) => i !== index));
          }}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Image className="w-4 h-4 mr-2" />
            Photo
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
              }
            }}
          />
          
          <EmojiPicker onSelect={(emoji) => setContent(prev => prev + emoji)} />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || uploading || remaining < 0}
          >
            {uploading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### **Step 3.4: PostCard.tsx - Display Posts**

```typescript
import { useState } from 'react';
import { MoreVertical, ThumbsUp, MessageCircle, Share2, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import ReactionBar from './ReactionBar';
import ReactionPicker from './ReactionPicker';
import CommentsList from './CommentsList';
import PostMenu from './PostMenu';
import AttachmentPreview from './AttachmentPreview';
import { addReaction, removeReaction } from '@/lib/feed/feedService';
import type { FeedPost } from '@/lib/feed/feedService';

interface PostCardProps {
  post: FeedPost;
  currentUser: any;
  onUpdate: () => void;
}

export default function PostCard({ post, currentUser, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Check if current user has reacted
  const userReaction = post.reactions?.find(r => r.user_id === currentUser.id);

  const handleReaction = async (reactionType: string) => {
    try {
      if (userReaction) {
        // Remove existing reaction
        await removeReaction(post.id, currentUser.id);
      }
      
      // Add new reaction
      await addReaction(post.id, currentUser.id, reactionType);
      onUpdate();
    } catch (error) {
      console.error('Failed to add reaction:', error);
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

  return (
    <div className={`rounded-lg shadow-sm border p-6 ${postTypeStyles[post.content_type]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {post.author?.photo_url ? (
              <img
                src={post.author.photo_url}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {post.author?.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Author Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.author?.name}</span>
              {postTypeIcons[post.content_type] && (
                <span className="text-sm">{postTypeIcons[post.content_type]}</span>
              )}
              {post.is_pinned && (
                <Pin className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              {post.edited_at && ' • Edited'}
            </div>
          </div>
        </div>

        {/* Menu */}
        <PostMenu
          post={post}
          currentUser={currentUser}
          onUpdate={onUpdate}
        />
      </div>

      {/* Content */}
      <div className="mb-4 whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <AttachmentPreview attachments={post.attachments} />
      )}

      {/* Reactions Summary */}
      {(post.reaction_count > 0 || post.comment_count > 0) && (
        <div className="flex items-center justify-between py-3 border-t border-gray-200 text-sm text-gray-600">
          <ReactionBar
            reactions={post.reactions || []}
            reactionCount={post.reaction_count}
          />
          {post.comment_count > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
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
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            {userReaction ? 'Liked' : 'Like'}
          </Button>
          
          {showReactionPicker && (
            <ReactionPicker
              onSelect={handleReaction}
              onClose={() => setShowReactionPicker(false)}
            />
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

        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 pt-4">
          <CommentsList
            postId={post.id}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
}
```

---

## ✨ PHASE 4: POLISH & TESTING

### **Step 4.1: Performance Optimization**

#### **Implement Virtual Scrolling**
```typescript
// Install react-window
// npm install react-window

import { FixedSizeList as List } from 'react-window';

// Use for long feed lists
<List
  height={600}
  itemCount={posts.length}
  itemSize={400}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  )}
</List>
```

#### **Image Lazy Loading**
```typescript
// Use native lazy loading
<img
  src={imageUrl}
  loading="lazy"
  alt="Post attachment"
  className="w-full h-auto"
/>

// Or use intersection observer
import { LazyLoadImage } from 'react-lazy-load-image-component';
```

#### **Code Splitting**
```typescript
// Lazy load heavy components
const PostComposer = lazy(() => import('./PostComposer'));
const CommentsList = lazy(() => import('./CommentsList'));

// Wrap with Suspense
<Suspense fallback={<Skeleton />}>
  <PostComposer />
</Suspense>
```

---

### **Step 4.2: Error Handling**

```typescript
// Create ErrorBoundary
class FeedErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Feed error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">
            Something went wrong
          </h2>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap feed page
<FeedErrorBoundary>
  <FeedPage />
</FeedErrorBoundary>
```

---

### **Step 4.3: Offline Support**

```typescript
// Use service worker for offline caching
// public/sw.js

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/feed')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Queue actions when offline
import { Queue } from 'workbox-background-sync';

const queue = new Queue('feedActions');

async function createPostOffline(post) {
  await queue.pushRequest({
    request: new Request('/api/feed/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    }),
  });
}
```

---

### **Step 4.4: Testing Checklist**

#### **Unit Tests**
```bash
# Install testing libraries
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

```typescript
// PostCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard from './PostCard';

describe('PostCard', () => {
  it('renders post content', () => {
    const post = {
      id: '1',
      content: 'Test post',
      author: { name: 'John' },
      created_at: new Date().toISOString(),
    };

    render(<PostCard post={post} />);
    expect(screen.getByText('Test post')).toBeInTheDocument();
  });

  it('shows reaction picker on like button click', () => {
    // ... test implementation
  });
});
```

#### **Integration Tests**
- Test post creation flow
- Test comment creation
- Test reaction system
- Test mention notifications
- Test file upload

#### **E2E Tests**
- Complete user journey
- Real-time updates
- Offline functionality
- Mobile responsiveness

---

### **Step 4.5: Accessibility**

```typescript
// Add ARIA labels
<button
  aria-label="Like post"
  aria-pressed={userHasLiked}
  onClick={handleLike}
>
  <ThumbsUp />
</button>

// Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Post action
</div>

// Screen reader announcements
<div role="status" aria-live="polite">
  {newPostsCount > 0 && `${newPostsCount} new posts`}
</div>
```

---

## 📊 COMPLETION CHECKLIST

### Database (Phase 1):
- [ ] Migration file created
- [ ] Tables created in Supabase
- [ ] Triggers working
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Verification queries passed

### Backend (Phase 2):
- [ ] Storage bucket configured
- [ ] Service functions created
- [ ] Real-time subscriptions working
- [ ] File upload working
- [ ] Mention extraction working

### Frontend (Phase 3):
- [ ] FeedPage component
- [ ] PostComposer component
- [ ] PostCard component
- [ ] ReactionPicker component
- [ ] CommentsList component
- [ ] MentionInput component
- [ ] AttachmentUploader component
- [ ] EmptyState component

### Polish (Phase 4):
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Offline support added
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] E2E tests passed
- [ ] Accessibility audit passed
- [ ] Mobile responsive verified

---

## 🚀 DEPLOYMENT STEPS

### 1. Database Migration
```bash
# Run in Supabase SQL Editor
# Copy content from: supabase/migrations/20260115000003_feed_module.sql
# Execute and verify
```

### 2. Storage Setup
```bash
# In Supabase Dashboard:
# 1. Create bucket: feed-attachments
# 2. Apply storage policies
# 3. Test upload
```

### 3. Frontend Deployment
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy
npm run deploy
```

### 4. Verification
- [ ] Create test post
- [ ] Add reaction
- [ ] Add comment
- [ ] Upload attachment
- [ ] @Mention user
- [ ] Pin post
- [ ] Check real-time updates
- [ ] Test on mobile

---

## 📈 SUCCESS METRICS

### Performance:
- Initial load < 2s ✓
- Time to interactive < 3s ✓
- Real-time latency < 500ms ✓

### Engagement:
- Posts per day
- Comments per post
- Reactions per post
- Active users per day

### Quality:
- Zero critical bugs
- < 1% error rate
- 100% mobile responsive
- WCAG 2.1 AA compliant

---

## 🎉 LAUNCH PLAN

### Soft Launch (Week 1):
- Enable for pilot team (5-10 users)
- Gather feedback
- Fix critical issues
- Monitor performance

### Full Launch (Week 2):
- Enable for all users
- Send announcement
- Provide training
- Monitor engagement

### Post-Launch (Week 3-4):
- Analyze usage data
- Implement Phase 2 features:
  - Rich text editor
  - GIF support
  - Post analytics
  - Saved posts
  - Hashtags
  - Search

---

## 🔮 FUTURE ENHANCEMENTS

### Phase 2 (Months 2-3):
- 📊 Post analytics (views, engagement rate)
- 🔍 Advanced search & filters
- 📌 Collections/Saved posts
- #️⃣ Hashtag support
- 🎬 Video attachments
- 📝 Rich text formatting
- 🖼️ GIF picker

### Phase 3 (Months 4-6):
- 🤖 AI-powered suggestions
- 📅 Scheduled posts
- 📮 Post templates
- 🏆 Gamification (badges, points)
- 📱 Push notifications
- 🌐 Multi-language support
- 📊 Analytics dashboard

---

**Implementation Status:** ✅ Ready to Begin  
**Estimated Completion:** February 5, 2026  
**Priority:** 🟠 HIGH  
**Dependencies:** Database migrations complete, Team management functional

---

## 🎯 QUICK START GUIDE

### For Developers:

1. **Apply Database Migration** (15 min)
   ```sql
   -- Copy supabase/migrations/20260115000003_feed_module.sql
   -- Run in Supabase SQL Editor
   ```

2. **Setup Storage** (10 min)
   - Create `feed-attachments` bucket
   - Apply storage policies

3. **Install Dependencies** (5 min)
   ```bash
   npm install react-window date-fns
   ```

4. **Create Components** (2-3 days)
   - Copy component code from plan
   - Customize styling
   - Wire up API calls

5. **Test Everything** (1 day)
   - Run test checklist
   - Fix issues
   - Optimize performance

6. **Deploy** (1 hour)
   - Build production
   - Deploy to hosting
   - Verify functionality

---

**Total Time Investment:** 2-3 weeks  
**Ready to Start:** ✅ YES  
**Next Action:** Apply database migration

---

**🎉 Feed Module Complete Implementation Plan Ready!**
