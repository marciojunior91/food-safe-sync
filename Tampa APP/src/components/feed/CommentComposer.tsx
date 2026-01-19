/**
 * =====================================================
 * COMMENT COMPOSER - Create/reply to comments
 * =====================================================
 * Features:
 * - Textarea with auto-resize
 * - @mentions with autocomplete
 * - Character counter
 * - Cancel button for replies
 * - Real-time validation
 */

import { useState, useRef, useEffect } from 'react';
import { Send, X, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { createComment, createMentions } from '@/lib/feed/feedService';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  display_name: string;
}

interface CommentComposerProps {
  postId: string;
  organizationId: string;
  authorId: string;
  parentCommentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentComposer({
  postId,
  organizationId,
  authorId,
  parentCommentId = null,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const maxLength = 2000;
  const isReply = !!parentCommentId;

  // Load team members for mentions
  useEffect(() => {
    loadTeamMembers();
  }, [organizationId]);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, display_name')
        .eq('organization_id', organizationId)
        .order('display_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  // Detect @ mentions
  const handleContentChange = (value: string) => {
    setContent(value);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    setCursorPosition(pos);

    // Check if user just typed @
    const textBeforeCursor = value.substring(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Show mentions if @ is recent and not in a completed mention
      if (textAfterAt.length < 20 && !textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
  };

  // Insert mention
  const insertMention = (member: TeamMember) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = cursorPosition;
    const textBeforeCursor = content.substring(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) return;

    // Replace @search with @[Name](id)
    const before = content.substring(0, lastAtIndex);
    const after = content.substring(pos);
    const mention = `@[${member.display_name}](${member.id})`;
    const newContent = before + mention + ' ' + after;

    setContent(newContent);
    setShowMentions(false);
    setMentionSearch('');

    // Focus and move cursor after mention
    setTimeout(() => {
      textarea.focus();
      const newPos = lastAtIndex + mention.length + 1;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Filter team members by search
  const filteredMembers = teamMembers.filter((member) =>
    member.display_name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Submit comment
  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      console.log('[CommentComposer] Creating comment:', {
        postId,
        authorId,
        content: content.trim(),
        parentCommentId,
      });

      const comment = await createComment({
        post_id: postId,
        author_id: authorId,
        content: content.trim(),
        parent_comment_id: parentCommentId,
      });

      // Extract and create mentions
      await createMentions(content, postId, comment.id, authorId);

      setContent('');
      toast({ title: isReply ? 'Reply posted' : 'Comment posted' });
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }

    // Cancel on Escape (for replies)
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const remainingChars = maxLength - content.length;
  const showCounter = content.length > maxLength * 0.8;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] resize-none pr-10"
          maxLength={maxLength}
        />

        {/* @ Mention button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-6 w-6 p-0"
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            
            const pos = textarea.selectionStart;
            const before = content.substring(0, pos);
            const after = content.substring(pos);
            setContent(before + '@' + after);
            
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(pos + 1, pos + 1);
            }, 0);
          }}
        >
          <AtSign className="h-4 w-4" />
        </Button>

        {/* Mentions autocomplete popover */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute z-50 mt-1 w-64 bg-popover border rounded-md shadow-md">
            <Command>
              <CommandList>
                <CommandGroup heading="Mention team member">
                  {filteredMembers.slice(0, 5).map((member) => (
                    <CommandItem
                      key={member.id}
                      onSelect={() => insertMention(member)}
                      className="cursor-pointer"
                    >
                      <AtSign className="h-4 w-4 mr-2" />
                      {member.display_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showCounter && (
            <span
              className={`text-xs ${
                remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {remainingChars} characters remaining
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting || remainingChars < 0}
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" />
            {submitting ? 'Posting...' : isReply ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Tip: Press Ctrl+Enter to post, @ to mention someone
      </p>
    </div>
  );
}
