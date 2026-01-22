/**
 * PostComposer - Create new feed posts
 * Supports text, announcements, alerts, and celebrations
 * Features: Character counter, post types, file attachments
 */

import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/feed/RichTextEditor';
import { toast } from 'sonner';
import { createPost, uploadAttachment, createMentions } from '@/lib/feed/feedService';
import { useUserContext } from '@/hooks/useUserContext';
import type { TeamMember } from '@/types/teamMembers';

interface PostComposerProps {
  selectedUser: TeamMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostComposer({ selectedUser, onClose, onSuccess }: PostComposerProps) {
  const { context } = useUserContext();
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'text' | 'announcement' | 'alert' | 'celebration'>('text');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxLength = 5000;
  const remaining = maxLength - content.length;

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    if (!selectedUser?.id || !context?.organization_id) {
      setError('Please select a team member first');
      return;
    }
    
    setUploading(true);
    setError('');

    try {
      // Create post using the selected team member ID
      // Debug logging
      const postData = {
        organization_id: context.organization_id,
        author_id: selectedUser.id, // Use team member ID, not auth user ID
        content: content.trim(),
        content_type: contentType,
      };
      
      console.log('[PostComposer] Creating post with data:', postData);
      console.log('[PostComposer] Selected user:', selectedUser);
      
      const newPost = await createPost(postData);

      // Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          await uploadAttachment(
            file,
            newPost.id,
            selectedUser.id, // Use team member ID
            context.organization_id
          );
        }
      }

      // Extract and create mentions (if any)
      await createMentions(content, newPost.id, null, selectedUser.id); // Use team member ID

      toast.success('Post created successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Limit to 5 files
      if (attachments.length + files.length > 5) {
        toast.error('Maximum 5 files allowed');
        return;
      }

      // Check file sizes (10MB max per file)
      const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
      if (oversized.length > 0) {
        toast.error('Files must be under 10MB');
        return;
      }

      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const postTypeConfig = {
    text: {
      label: '📝 Text',
      bg: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
      activeBg: 'bg-orange-100 dark:bg-orange-900/20',
      activeText: 'text-orange-800 dark:text-orange-300',
    },
    announcement: {
      label: '📢 Announcement',
      bg: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20',
      activeBg: 'bg-orange-200 dark:bg-orange-900/30',
      activeText: 'text-orange-900 dark:text-orange-200',
    },
    alert: {
      label: '🚨 Alert',
      bg: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20',
      activeBg: 'bg-red-200 dark:bg-red-900/30',
      activeText: 'text-red-900 dark:text-red-200',
    },
    celebration: {
      label: '🎉 Celebration',
      bg: 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20',
      activeBg: 'bg-yellow-200 dark:bg-yellow-900/30',
      activeText: 'text-yellow-900 dark:text-yellow-200',
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-900 rounded-lg p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Post</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          disabled={uploading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Post Type Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(postTypeConfig) as Array<[typeof contentType, typeof postTypeConfig.text]>).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setContentType(type)}
            disabled={uploading}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              contentType === type
                ? `${config.activeBg} ${config.activeText}`
                : `${config.bg} text-gray-600`
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Content Input */}
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Share updates, ask questions, or celebrate wins with your team... Use the toolbar for formatting!"
        maxLength={maxLength}
        disabled={uploading}
      />

      {/* Character Counter */}
      <div className={`text-sm text-right mt-2 mb-4 ${
        remaining < 100 ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {remaining.toLocaleString()} characters remaining
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attachments ({attachments.length}/5)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/10 rounded border border-orange-200 dark:border-orange-800"
              >
                <ImageIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-sm truncate flex-1 text-gray-900 dark:text-gray-100">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading || attachments.length >= 5}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || attachments.length >= 5}
            className="hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-900/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || uploading || remaining < 0}
            className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
