import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Venue } from '@/types/organization';

/**
 * Hook to get available venues for the current user's franchise group.
 * Returns an empty list if the user's organization is not part of a franchise.
 */
export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [currentVenueId, setCurrentVenueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);

      // Call the RPC function that returns venues in the user's franchise group
      const { data, error } = await supabase.rpc('get_user_venues');

      if (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
        return;
      }

      const venueList = (data || []) as Venue[];
      setVenues(venueList);

      // Set current venue to the user's own organization
      if (venueList.length > 0 && !currentVenueId) {
        // Get user's current org
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

          if (profile?.organization_id) {
            setCurrentVenueId(profile.organization_id);
          }
        }
      }
    } catch (err) {
      console.error('useVenues error:', err);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const selectVenue = useCallback((venueId: string) => {
    setCurrentVenueId(venueId);
    // The venue context switch is handled by the consuming component
    // For now, we just track selection — actual data filtering will come in future iterations
  }, []);

  const currentVenue = venues.find(v => v.id === currentVenueId) || null;
  const hasMultipleVenues = venues.length > 1;

  return {
    venues,
    currentVenue,
    currentVenueId,
    selectVenue,
    hasMultipleVenues,
    loading,
  };
}
