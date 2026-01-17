import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FeedItem,
  CreateFeedItemInput,
  FeedFilters,
  FeedChannel,
  FeedType,
  FeedPriority
} from '@/types/feed';

/**
 * Hook for managing feed items (notifications)
 * Provides CRUD operations, filtering, and real-time subscriptions
 */
export function useFeed(userId?: string, organizationId?: string) {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch feed items with optional filters
  const fetchFeed = useCallback(async (filters?: FeedFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('feed_items')
        .select(`
          *,
          created_by_user:profiles!feed_items_created_by_fkey(user_id, display_name),
          related_user:profiles!feed_items_target_user_id_fkey(user_id, display_name),
          feed_reads(*)
        `)
        .order('created_at', { ascending: false });

      // Apply organization filter if provided
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      // Apply filters
      if (filters) {
        if (filters.channel) {
          query = query.eq('channel', filters.channel);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        if (filters.unread_only && userId) {
          // Only show items that haven't been read by this user
          query = query.not('read_by', 'cs', `{${userId}}`);
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setFeedItems((data as any[]) || []);

      // Calculate unread count if userId is provided
      if (userId && data) {
        const unread = data.filter(
          item => !item.feed_reads?.some((read: any) => read.user_id === userId)
        ).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, organizationId]);

  // Create a new feed item
  const createFeedItem = async (
    input: CreateFeedItemInput
  ): Promise<FeedItem | null> => {
    try {
      const { data, error: createError } = await supabase
        .from('feed_items')
        .insert({
          ...input,
          organization_id: organizationId
        })
        .select(`
          *,
          created_by_user:profiles!feed_items_created_by_fkey(user_id, display_name),
          related_user:profiles!feed_items_target_user_id_fkey(user_id, display_name),
          feed_reads(*)
        `)
        .single();

      if (createError) throw createError;

      // Update local state
      if (data) {
        setFeedItems(prev => [data as any, ...prev]);
        if (userId && !data.feed_reads?.some((read: any) => read.user_id === userId)) {
          setUnreadCount(prev => prev + 1);
        }
      }

      return data as any;
    } catch (err) {
      console.error('Error creating feed item:', err);
      setError(err as Error);
      return null;
    }
  };

  // Mark feed item as read
  const markAsRead = async (feedItemId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Check if already read
      const item = feedItems.find(f => f.id === feedItemId);
      if (!item) return false;

      const alreadyRead = item.feed_reads?.some((read: any) => read.user_id === userId);
      if (alreadyRead) return true; // Already read

      // Create feed_read record
      const { error: createError } = await supabase
        .from('feed_reads')
        .insert({
          feed_item_id: feedItemId,
          user_id: userId,
          read_at: new Date().toISOString()
        });

      if (createError) throw createError;

      // Update local state
      setFeedItems(prev =>
        prev.map(feedItem =>
          feedItem.id === feedItemId
            ? {
                ...feedItem,
                feed_reads: [
                  ...(feedItem.feed_reads || []),
                  { user_id: userId, read_at: new Date().toISOString() }
                ]
              }
            : feedItem
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('Error marking feed item as read:', err);
      setError(err as Error);
      return false;
    }
  };

  // Mark all as read
  const markAllAsRead = async (channel?: FeedChannel): Promise<boolean> => {
    if (!userId) return false;

    try {
      let query = supabase
        .from('feed_items')
        .select('id, feed_reads(user_id)');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (channel) {
        query = query.eq('channel', channel);
      }

      // Get items that user hasn't read yet
      const { data: items, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const unreadItems = items?.filter(
        item => !item.feed_reads?.some((read: any) => read.user_id === userId)
      );

      if (!unreadItems || unreadItems.length === 0) return true;

      // Create read records for all unread items
      const readRecords = unreadItems.map(item => ({
        feed_item_id: item.id,
        user_id: userId,
        read_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('feed_reads')
        .insert(readRecords);

      if (insertError) throw insertError;

      // Update local state
      setFeedItems(prev =>
        prev.map(feedItem => ({
          ...feedItem,
          feed_reads: [
            ...(feedItem.feed_reads || []),
            { user_id: userId, read_at: new Date().toISOString() }
          ]
        }))
      );

      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err as Error);
      return false;
    }
  };

  // Delete a feed item
  const deleteFeedItem = async (feedItemId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('feed_items')
        .delete()
        .eq('id', feedItemId);

      if (deleteError) throw deleteError;

      // Update local state
      const item = feedItems.find(f => f.id === feedItemId);
      if (item && userId && !item.feed_reads?.some((read: any) => read.user_id === userId)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setFeedItems(prev => prev.filter(feedItem => feedItem.id !== feedItemId));

      return true;
    } catch (err) {
      console.error('Error deleting feed item:', err);
      setError(err as Error);
      return false;
    }
  };

  // Get items by channel
  const getByChannel = (channel: FeedChannel) => {
    return feedItems.filter(item => item.channel === channel);
  };

  // Get unread items
  const getUnreadItems = () => {
    if (!userId) return [];
    return feedItems.filter(item => !item.feed_reads?.some((read: any) => read.user_id === userId));
  };

  // Get items by type
  const getByType = (type: FeedType) => {
    return feedItems.filter(item => item.type === type);
  };

  // Get items by priority
  const getByPriority = (priority: FeedPriority) => {
    return feedItems.filter(item => item.priority === priority);
  };

  // Check if item is read by user
  const isRead = (feedItemId: string): boolean => {
    if (!userId) return false;
    const item = feedItems.find(f => f.id === feedItemId);
    return item?.feed_reads?.some((read: any) => read.user_id === userId) || false;
  };

  // Initial fetch
  useEffect(() => {
    if (organizationId) {
      fetchFeed();
    }
  }, [organizationId, fetchFeed]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`feed:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_items',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFeedItems(prev => [payload.new as any, ...prev]);
            // Increment unread if this item is not read by current user
            if (userId) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            setFeedItems(prev =>
              prev.map(item =>
                item.id === payload.new.id ? { ...item, ...payload.new } : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const item = feedItems.find(f => f.id === payload.old.id);
            if (item && userId && !item.feed_reads?.some((read: any) => read.user_id === userId)) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setFeedItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_reads',
          filter: userId ? `user_id=eq.${userId}` : undefined
        },
        (payload) => {
          // Update feed item when read status changes
          setFeedItems(prev =>
            prev.map(item =>
              item.id === payload.new.feed_item_id
                ? {
                    ...item,
                    feed_reads: [...(item.feed_reads || []), payload.new as any]
                  }
                : item
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, userId, feedItems]);

  return {
    feedItems,
    loading,
    error,
    unreadCount,
    // CRUD operations
    fetchFeed,
    createFeedItem,
    markAsRead,
    markAllAsRead,
    deleteFeedItem,
    // Helper functions
    getByChannel,
    getUnreadItems,
    getByType,
    getByPriority,
    isRead,
    // Refresh
    refresh: fetchFeed
  };
}
