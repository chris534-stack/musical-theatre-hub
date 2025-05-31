import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface ReviewerProfile {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  pronouns?: string;
  reviewer_application_status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  created_at: string;
  updated_at: string;
}

interface UseIsReviewerReturn {
  isReviewer: boolean;
  reviewerProfile: ReviewerProfile | null;
  loading: boolean;
  error: any | null;
  user: User | null;
  refetch: () => Promise<void>;
}

export default function useIsReviewer(): UseIsReviewerReturn {
  const [user, setUser] = useState<User | null>(null);
  const [reviewerProfile, setReviewerProfile] = useState<ReviewerProfile | null>(null);
  const [isReviewer, setIsReviewer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);
  
  // Use a ref to track component mount state
  const isMounted = useRef<boolean>(true);
  
  // Fetch user and reviewer status function
  const fetchUserAndReviewerStatus = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[useIsReviewer] fetchUserAndReviewerStatus - Session:', session);
      console.log('[useIsReviewer] fetchUserAndReviewerStatus - Session error:', sessionError);

      if (sessionError) {
        throw sessionError;
      }

      // Update user state
      const currentUser = session?.user ?? null;
      console.log('[useIsReviewer] fetchUserAndReviewerStatus - Current user:', currentUser);
      if (isMounted.current) {
        setUser(currentUser);
      }

      // If there's a logged-in user, check reviewer status
      if (currentUser) {
        try {
          console.log('[useIsReviewer] Fetching reviewer data for user:', currentUser.id);
          // Fix 406 error by using filter-then-maybeSingle pattern instead of eq+single
          const { data, error: reviewerError } = await supabase
            .from('reviewers')
            .select('*')
            .filter('id', 'eq', currentUser.id)
            .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows found

          // With maybeSingle(), we don't get PGRST116 errors anymore for no rows
          // Instead, data will be null when no rows are found
          if (reviewerError) {
            // Real database or API error
            console.error('[useIsReviewer] Error fetching reviewer status:', reviewerError);
            if (isMounted.current) {
              setError({
                message: 'Error fetching reviewer status',
                code: reviewerError.code || 'UNKNOWN',
                details: reviewerError.message || 'Unknown error'
              });
              setReviewerProfile(null);
              setIsReviewer(false);
            }
          } else if (data) {
            // User has a reviewer profile
            console.log('[useIsReviewer] Found reviewer profile:', data ? data.reviewer_application_status : 'none');
            if (isMounted.current) {
              setReviewerProfile(data as ReviewerProfile);
              setIsReviewer(data.reviewer_application_status === 'approved');
            }
          } else {
            // No reviewer profile found (data is null)
            console.log('[useIsReviewer] No reviewer profile found for user');
            if (isMounted.current) {
              setReviewerProfile(null);
              setIsReviewer(false);
            }
          }
        } catch (e: any) {
          console.error('Unexpected error checking reviewer status:', e);
          if (isMounted.current) {
            setError({
              message: 'Unexpected error checking reviewer status',
              details: e.message || 'Unknown error',
              code: 'UNEXPECTED_ERROR'
            });
            setReviewerProfile(null);
            setIsReviewer(false);
          }
        }
      } else {
        // No user logged in
        if (isMounted.current) {
          setReviewerProfile(null);
          setIsReviewer(false);
        }
      }
    } catch (e: any) {
      console.error('Error in useIsReviewer:', e);
      if (isMounted.current) {
        setError(e);
        setIsReviewer(false);
        setReviewerProfile(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch and set up auth state listener
  useEffect(() => {
    // Reset the mounted ref (in case of hot reloads)
    isMounted.current = true;
    
    // Initial fetch
    fetchUserAndReviewerStatus();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useIsReviewer] onAuthStateChange - Event:', event);
        console.log('[useIsReviewer] onAuthStateChange - Session:', session);
        if (!isMounted.current) return;
        
        // Update user state immediately
        setUser(session?.user ?? null);
        
        // Re-fetch reviewer status
        await fetchUserAndReviewerStatus();
      }
    );
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserAndReviewerStatus]);

  // Expose a refetch function for external components to trigger a refresh
  const refetch = useCallback(async () => {
    await fetchUserAndReviewerStatus();
  }, [fetchUserAndReviewerStatus]);

  return {
    isReviewer,
    reviewerProfile,
    loading,
    error,
    user,
    refetch,
  };
}
