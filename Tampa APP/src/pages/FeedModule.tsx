/**
 * FeedModule - Social collaboration feed with posts, reactions, and comments
 * Theme: Orange & Black professional design
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useFeed } from '@/lib/feed/feedHooks';
import { useUserContext } from '@/hooks/useUserContext';
import { supabase } from '@/integrations/supabase/client';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import EmptyFeedState from '@/components/feed/EmptyFeedState';
import { IncompleteProfilesAlert } from '@/components/feed/IncompleteProfilesAlert';
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';
import type { TeamMember } from '@/types/teamMembers';

export default function FeedModule() {
  const navigate = useNavigate();
  const { context, loading: contextLoading } = useUserContext();
  const [showComposer, setShowComposer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pinned' | 'mentions'>('all');

  // Don't load feed until we have an organization_id
  const organizationId = context?.organization_id || '';
  const shouldLoadFeed = !!organizationId;

  const {
    posts,
    loading,
    error,
    loadMore,
    hasMore,
    refresh,
  } = useFeed(organizationId, filter);

  // ALWAYS open user selection dialog if no user selected (FIX)
  useEffect(() => {
    if (!contextLoading && organizationId && !selectedUser) {
      setUserDialogOpen(true);
    }
  }, [contextLoading, organizationId, selectedUser]);

  // Handle user selection
  const handleUserSelected = (user: TeamMember) => {
    setSelectedUser(user);
    toast.success(`Viewing feed as ${user.display_name}`);
  };

  // BUG-007 FIX: Real-time subscriptions for feed updates
  useEffect(() => {
    if (!organizationId) return;

    console.log('[FeedModuleV2] Setting up real-time subscription for org:', organizationId);

    const channel = supabase
      .channel('feed_posts_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_posts',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('[FeedModuleV2] Real-time update:', payload.eventType);
          // Refresh feed on any change (insert, update, delete)
          refresh();
          
          // Show toast notification for new posts
          if (payload.eventType === 'INSERT') {
            toast.info('New post available', {
              description: 'The feed has been updated',
              duration: 3000
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[FeedModuleV2] Subscription status:', status);
      });

    return () => {
      console.log('[FeedModuleV2] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [organizationId, refresh]);

  // Show loading while context is loading
  if (contextLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading feed</p>
          <Button onClick={refresh} className="bg-orange-600 hover:bg-orange-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Incomplete Profile Alert for Selected User */}
        {selectedUser && !selectedUser.profile_complete && (
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                    Profile Incomplete
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                    {selectedUser.display_name}'s profile is not complete. Please update personal information, emergency contacts, and required certificates.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-orange-600 text-orange-600 hover:bg-orange-50"
                  onClick={() => navigate(`/people/${selectedUser.id}`)}
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manager Alert for All Incomplete Profiles */}
        {(context?.user_role === 'admin' || context?.user_role === 'manager' || context?.user_role === 'owner') && (
          <IncompleteProfilesAlert 
            organizationId={organizationId} 
            userRole={context?.user_role}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Feed</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Share updates and collaborate with your team
              </p>
            </div>
            {/* Selected User Badge */}
            {selectedUser && (
              <Badge variant="secondary" className="h-fit bg-orange-100 text-orange-900 border-orange-300">
                <User className="w-3 h-3 mr-1" />
                {selectedUser.display_name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* User Selection Button */}
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(true)}
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              <User className="w-4 h-4 mr-2" />
              {selectedUser ? 'Change User' : 'Select User'}
            </Button>

            {/* Refresh Button */}
            <Button 
              onClick={() => {
                refresh();
                toast.success('Feed refreshed');
              }} 
              variant="outline" 
              size="icon"
              disabled={loading}
              className="border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            {/* Create Post Button - Only for admin/manager/leader_chef */}
            {selectedUser && (
              selectedUser.role_type === 'admin' || 
              selectedUser.role_type === 'manager' || 
              selectedUser.role_type === 'leader_chef'
            ) && (
              <Button onClick={() => setShowComposer(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setFilter('pinned')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pinned'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
            }`}
          >
            📌 Pinned
          </button>
          <button
            onClick={() => setFilter('mentions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'mentions'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
            }`}
          >
            @ Mentions
          </button>
        </div>

        {/* Post Composer Dialog */}
        {showComposer && selectedUser && (
          <div className="mb-6">
            <PostComposer
              selectedUser={selectedUser}
              onClose={() => setShowComposer(false)}
              onSuccess={() => {
                setShowComposer(false);
                refresh();
                toast.success('Post created successfully!');
              }}
            />
          </div>
        )}

        {/* Feed Content */}
        {loading && posts.length === 0 ? (
          // Loading skeletons
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
          // Empty state
          <EmptyFeedState 
            filter={filter}
            // Only show create button if user has permission
            onCreatePost={
              selectedUser && (
                selectedUser.role_type === 'admin' || 
                selectedUser.role_type === 'manager' || 
                selectedUser.role_type === 'leader_chef'
              ) ? () => setShowComposer(true) : undefined
            }
          />
        ) : (
          // Posts list
          <>
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={selectedUser?.id || context?.user_id || ''}
                  organizationId={context?.organization_id || ''}
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
                  size="lg"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Selection Dialog */}
      <UserSelectionDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSelectUser={handleUserSelected}
      />
    </div>
  );
}
