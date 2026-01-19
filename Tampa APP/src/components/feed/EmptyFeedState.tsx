/**
 * EmptyFeedState - Display when no posts are available
 * Shows different messages based on filter type
 */

import { MessageSquare, Pin, AtSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyFeedStateProps {
  filter?: 'all' | 'pinned' | 'mentions';
  onCreatePost?: () => void;
}

export default function EmptyFeedState({ filter = 'all', onCreatePost }: EmptyFeedStateProps) {
  const configs = {
    all: {
      icon: MessageSquare,
      title: 'No posts yet',
      description: 'Be the first to share an update with your team!',
      showButton: true,
    },
    pinned: {
      icon: Pin,
      title: 'No pinned posts',
      description: 'Pin important posts to keep them at the top of the feed.',
      showButton: false,
    },
    mentions: {
      icon: AtSign,
      title: 'No mentions',
      description: 'When someone mentions you, it will appear here.',
      showButton: false,
    },
  };

  const config = configs[filter];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {config.title}
      </h3>
      
      <p className="text-gray-500 text-center max-w-sm mb-6">
        {config.description}
      </p>

      {config.showButton && onCreatePost && (
        <Button onClick={onCreatePost}>
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      )}
    </div>
  );
}
