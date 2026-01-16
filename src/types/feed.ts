// ============================================================================
// Feed Types (formerly Notifications)
// ============================================================================

export type FeedType = 
  | 'task_delegated'
  | 'pending_docs'
  | 'custom_note'
  | 'maintenance'
  | 'system';

export type FeedChannel = 
  | 'general'
  | 'baristas'
  | 'cooks'
  | 'maintenance';

export type FeedPriority = 'critical' | 'high' | 'normal' | 'low';

export interface FeedItem {
  id: string;
  organization_id: string;
  type: FeedType;
  channel: FeedChannel;
  title: string;
  message: string;
  priority: FeedPriority;
  created_by?: string;
  target_user_id?: string; // null for channel-wide messages
  related_entity_type?: string; // 'task', 'profile', 'document', etc.
  related_entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
  // Joined data
  creator?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
  };
  feed_reads?: FeedRead[];
  read_status?: FeedRead;
}

export interface FeedRead {
  id: string;
  feed_item_id: string;
  user_id: string;
  read_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
}

// Form data types
export interface CreateFeedItemInput {
  type: FeedType;
  channel: FeedChannel;
  title: string;
  message: string;
  priority?: FeedPriority;
  target_user_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export interface FeedFilters {
  channel?: FeedChannel;
  type?: FeedType;
  priority?: FeedPriority;
  unread_only?: boolean;
  date_from?: string;
  date_to?: string;
}

// Helper constants
export const FEED_TYPE_LABELS: Record<FeedType, string> = {
  task_delegated: 'Task Assigned',
  pending_docs: 'Pending Documents',
  custom_note: 'Note',
  maintenance: 'Maintenance',
  system: 'System'
};

export const FEED_CHANNEL_LABELS: Record<FeedChannel, string> = {
  general: 'General',
  baristas: 'Baristas',
  cooks: 'Cooks',
  maintenance: 'Maintenance'
};

export const FEED_PRIORITY_LABELS: Record<FeedPriority, string> = {
  critical: 'Critical',
  high: 'High',
  normal: 'Normal',
  low: 'Low'
};

// Helper functions
export function getFeedTypeIcon(type: FeedType): string {
  const icons: Record<FeedType, string> = {
    task_delegated: '📋',
    pending_docs: '⚠️',
    custom_note: '📝',
    maintenance: '🔧',
    system: '⚙️'
  };
  return icons[type];
}

export function getFeedChannelIcon(channel: FeedChannel): string {
  const icons: Record<FeedChannel, string> = {
    general: '🌐',
    baristas: '☕',
    cooks: '👨‍🍳',
    maintenance: '🔧'
  };
  return icons[channel];
}

export function getFeedPriorityColor(priority: FeedPriority): string {
  const colors: Record<FeedPriority, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    normal: 'text-blue-600 bg-blue-50',
    low: 'text-gray-600 bg-gray-50'
  };
  return colors[priority];
}
