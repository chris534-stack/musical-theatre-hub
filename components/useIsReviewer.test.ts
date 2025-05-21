import { renderHook, act, waitFor } from '@testing-library/react';
import useIsReviewer from './useIsReviewer';
import { supabase } from '../lib/supabaseClient'; // This will be the mock

// Explicitly tell Jest to use the mock
jest.mock('../lib/supabaseClient');

const mockUser = {
  id: 'user-id-123',
  email: 'reviewer@example.com',
  user_metadata: { full_name: 'Test User' },
  // Add other user properties if your hook uses them
};

const mockReviewerProfileApproved = {
  id: 'user-id-123',
  first_name: 'Test',
  last_name: 'User',
  reviewer_application_status: 'approved',
  // Add other profile fields
};

const mockReviewerProfilePending = {
  id: 'user-id-123',
  first_name: 'Test',
  last_name: 'User',
  reviewer_application_status: 'pending',
};

describe('useIsReviewer Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    supabase.resetMocks();
  });

  it('should return loading true initially', () => {
    const { result } = renderHook(() => useIsReviewer());
    expect(result.current.loading).toBe(true);
  });

  it('should return not loading, no user, and not reviewer if no session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    
    const { result } = renderHook(() => useIsReviewer());

    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.user).toBeNull();
    expect(result.current.isReviewer).toBe(false);
    expect(result.current.reviewerProfile).toBeNull();
  });

  it('should return approved reviewer status correctly', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    supabase.from().select().eq().single.mockResolvedValue({ data: mockReviewerProfileApproved, error: null });

    const { result } = renderHook(() => useIsReviewer());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isReviewer).toBe(true);
    expect(result.current.reviewerProfile).toEqual(mockReviewerProfileApproved);
  });

  it('should return pending reviewer status correctly', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    supabase.from().select().eq().single.mockResolvedValue({ data: mockReviewerProfilePending, error: null });

    const { result } = renderHook(() => useIsReviewer());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isReviewer).toBe(false);
    expect(result.current.reviewerProfile).toEqual(mockReviewerProfilePending);
  });

  it('should return not reviewer if profile not found (PGRST116 error)', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    supabase.from().select().eq().single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });

    const { result } = renderHook(() => useIsReviewer());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isReviewer).toBe(false);
    expect(result.current.reviewerProfile).toBeNull();
  });
  
  it('should return error if fetching session fails', async () => {
    const sessionError = new Error('Failed to fetch session');
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: sessionError });

    const { result } = renderHook(() => useIsReviewer());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(sessionError);
    expect(result.current.isReviewer).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should return error if fetching reviewer profile fails (non-PGRST116)', async () => {
    const profileError = new Error('DB connection error');
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    supabase.from().select().eq().single.mockResolvedValue({ data: null, error: profileError });

    const { result } = renderHook(() => useIsReviewer());

    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.error).toBe(profileError);
    expect(result.current.isReviewer).toBe(false);
    expect(result.current.reviewerProfile).toBeNull();
  });

  it('should react to auth state changes', async () => {
    // Initial state: No user
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    let authCallback;
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback; // Capture the callback
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    
    const { result, rerender } = renderHook(() => useIsReviewer());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();

    // Simulate user signing in
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null }); // getSession will be called again by the hook
    supabase.from().select().eq().single.mockResolvedValue({ data: mockReviewerProfileApproved, error: null });

    await act(async () => {
      authCallback('SIGNED_IN', { user: mockUser }); // Trigger the auth state change
      // Wait for the hook to re-evaluate and update state
    });
    
    rerender(); // Rerender to reflect updated state from auth change

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isReviewer).toBe(true);
      expect(result.current.reviewerProfile).toEqual(mockReviewerProfileApproved);
    });

    // Simulate user signing out
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
     supabase.from().select().eq().single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });


    await act(async () => {
      authCallback('SIGNED_OUT', null); // Trigger the auth state change
    });
    
    rerender();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isReviewer).toBe(false);
      expect(result.current.reviewerProfile).toBeNull();
    });
  });
  
  it('should unsubscribe from onAuthStateChange on unmount', () => {
    const unsubscribeMock = jest.fn();
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });

    const { unmount } = renderHook(() => useIsReviewer());
    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

});
