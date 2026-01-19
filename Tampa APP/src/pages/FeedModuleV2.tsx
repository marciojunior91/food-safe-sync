/**
 * FeedModuleV2 - Social collaboration feed with posts, reactions, and comments
 * Replaces old notification-style feed with social media style posts
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
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import EmptyFeedState from '@/components/feed/EmptyFeedState';
import { IncompleteProfilesAlert } from '@/components/feed/IncompleteProfilesAlert';
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';
import type { TeamMember } from '@/types/teamMembers';

export default function FeedModuleV2() {
  const navigate = useNavigate();
  const { context, loading: contextLoading } = useUserContext();
  const [showComposer, setShowComposer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
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

  // Auto-open user selection dialog on first mount if no user selected
  useEffect(() => {
    if (!contextLoading && context?.organization_id && !selectedUser && !hasAutoOpened) {
      setUserDialogOpen(true);
      setHasAutoOpened(true);
    }
  }, [contextLoading, context?.organization_id, selectedUser, hasAutoOpened]);

  // Handle user selection
  const handleUserSelected = (user: TeamMember) => {
    setSelectedUser(user);
    toast.success(`Viewing feed as ${user.display_name}`);
  };

  // Show loading while context is loading
  if (contextLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
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
          <Button onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Incomplete Profile Alert for Selected User */}
        {selectedUser && !selectedUser.profile_complete && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Profile Incomplete
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    {selectedUser.display_name}'s profile is not complete. Please update personal information, emergency contacts, and required certificates.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
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
              <h1 className="text-3xl font-bold text-gray-900">Team Feed</h1>
              <p className="text-gray-600 mt-1">
                Share updates and collaborate with your team
              </p>
            </div>
            {/* Selected User Badge */}
            {selectedUser && (
              <Badge variant="secondary" className="h-fit">
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
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            {/* Create Post Button - Only for admin/manager/leader_chef */}
            {selectedUser && (
              selectedUser.role_type === 'admin' || 
              selectedUser.role_type === 'manager' || 
              selectedUser.role_type === 'leader_chef'
            ) && (
              <Button onClick={() => setShowComposer(true)}>
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
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setFilter('pinned')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pinned'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            📌 Pinned
          </button>
          <button
            onClick={() => setFilter('mentions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'mentions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
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
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
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
