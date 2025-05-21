import { useState, useEffect } from 'react';
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
  // Add any other fields you expect from the reviewers table
}

interface UseIsReviewerReturn {
  isReviewer: boolean;
  reviewerProfile: ReviewerProfile | null;
  loading: boolean;
  error: any | null;
  user: User | null;
}

export default function useIsReviewer(): UseIsReviewerReturn {
  const [user, setUser] = useState<User | null>(null);
  const [reviewerProfile, setReviewerProfile] = useState<ReviewerProfile | null>(null);
  const [isReviewer, setIsReviewer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts

    const fetchUserAndReviewerStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const currentUser = session?.user ?? null;
        if (isMounted) {
          setUser(currentUser);
        }

        if (currentUser) {
          try {
            const { data, error: reviewerError } = await supabase
              .from('reviewers')
              .select('*')
              .eq('id', currentUser.id)
              .single(); // Use single() as 'id' is PK and should be unique
  
            if (reviewerError) {
              // PGRST116: 'No rows found'. This is not an error in this context,
              // it just means the user is not in the reviewers table.
              if (reviewerError.code === 'PGRST116') {
                if (isMounted) {
                  setReviewerProfile(null);
                  setIsReviewer(false);
                }
              } else if (reviewerError.message?.includes('relation "public.reviewers" does not exist')) {
                // Handle the case where the reviewers table doesn't exist
                console.error('Reviewers table does not exist:', reviewerError);
                if (isMounted) {
                  setError({
                    message: 'The reviewers table does not exist in the database. Please contact the administrator.',
                    code: 'TABLE_NOT_FOUND',
                    details: reviewerError.message
                  });
                  setReviewerProfile(null);
                  setIsReviewer(false);
                }
              } else if (reviewerError.code === '42501' || reviewerError.message?.includes('permission denied')) {
                // Handle RLS permission issues
                console.error('RLS permission denied:', reviewerError);
                if (isMounted) {
                  setError({
                    message: 'Access to reviewer data is restricted. Please contact the administrator.',
                    code: 'PERMISSION_DENIED',
                    details: reviewerError.message
                  });
                  setReviewerProfile(null);
                  setIsReviewer(false);
                }
              } else {
                // Other errors should be properly formatted and reported
                console.error('Other reviewer data error:', reviewerError);
                if (isMounted) {
                  setError({
                    message: 'Error fetching reviewer status',
                    code: reviewerError.code || 'UNKNOWN',
                    details: reviewerError.message || 'Unknown error'
                  });
                  setReviewerProfile(null);
                  setIsReviewer(false);
                }
              }
            } else {
              if (isMounted) {
                setReviewerProfile(data as ReviewerProfile);
                setIsReviewer(data.reviewer_application_status === 'approved');
              }
            }
          } catch (e: any) {
            console.error('Unexpected error in reviewer lookup:', e);
            if (isMounted) {
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
          if (isMounted) {
            setReviewerProfile(null);
            setIsReviewer(false);
          }
        }
      } catch (e) {
        console.error('Error in useIsReviewer:', e);
        if (isMounted) {
          setError(e);
          setIsReviewer(false);
          setReviewerProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserAndReviewerStatus();

    // Listen for auth state changes to update reviewer status dynamically
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Re-fetch user and reviewer status on sign-in, sign-out, or token refresh
        if (isMounted) {
          setUser(session?.user ?? null); // Update user immediately
        }
        await fetchUserAndReviewerStatus(); // Re-validate reviewer status
      }
    );
    
    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { isReviewer, reviewerProfile, loading, error, user };
}
