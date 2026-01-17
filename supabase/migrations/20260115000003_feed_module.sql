-- =====================================================
-- FEED MODULE - Complete Database Schema
-- =====================================================
-- Version: 1.0
-- Created: January 15, 2026
-- Description: Social feed with posts, comments, reactions, mentions, attachments
-- Author: GitHub Copilot
-- Estimated execution time: 30-45 seconds

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

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'feed_%' ORDER BY table_name;

-- Check triggers
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname LIKE '%feed%';

-- Check indexes
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename LIKE 'feed_%' ORDER BY tablename, indexname;

-- Check RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'feed_%';
