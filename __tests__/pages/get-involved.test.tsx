import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import GetInvolved, { ReviewerSignInSection } from '../../pages/get-involved'; // Adjusted import path
import { useIsReviewer } from '../../components/useIsReviewer'; // Adjusted import path
import { supabase } from '../../lib/supabaseClient'; // Adjusted import path
import ReviewerApplicationModal from '../../components/ReviewerApplicationModal'; // Adjusted import path

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock useIsReviewer hook
jest.mock('../../components/useIsReviewer'); // Adjusted import path

// Mock Supabase client
jest.mock('../../lib/supabaseClient'); // Adjusted import path

// Mock ReviewerApplicationModal
jest.mock('../../components/ReviewerApplicationModal', () => ({ // Adjusted import path
  __esModule: true,
  default: jest.fn(({ isOpen, onClose, onSubmitted }) =>
    isOpen ? (
      <div data-testid="mock-reviewer-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={onSubmitted}>Submit Modal</button>
      </div>
    ) : null
  ),
}));


describe('GetInvolved Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      route: '/get-involved',
      pathname: '/get-involved',
      query: {},
      asPath: '/get-involved',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      basePath: '',
      isPreview: false,
    });
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: {url: 'http://localhost:3000'}, error: null });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });


    // Reset mocks for ReviewerApplicationModal if needed or ensure it's fresh
    (ReviewerApplicationModal as jest.Mock).mockClear();
  });

  describe('ReviewerSignInSection', () => {
    const mockSetShowModal = jest.fn();

    const defaultUseIsReviewerValues = {
      user: null,
      reviewerProfile: null,
      isReviewer: false,
      loading: false,
      error: null,
    };

    beforeEach(() => {
      (useIsReviewer as jest.Mock).mockReturnValue(defaultUseIsReviewerValues);
      // Consolidate useState mocks or make them more specific if needed
      // This generic mock might be too broad if other useStates are added to the component.
      // For ReviewerSignInSection, the relevant states are showModal, signInLoading, thankYou.
      const mockStates = {
        showModal: false,
        signInLoading: false,
        thankYou: false,
      };
      const mockSetters = {
        setShowModal: mockSetShowModal,
        setSignInLoading: jest.fn(),
        setThankYou: jest.fn(),
      };

      // Remove the problematic global React.useState spy from beforeEach.
      // State changes will be tested by observing UI effects.
      // mockSetShowModal.mockClear(); // mockSetShowModal was part of the removed spy
    });
    
    afterEach(() => {
        jest.restoreAllMocks(); 
    });

    it('renders Sign in with Google button when not authenticated', () => {
      mockUseIsReviewer.mockReturnValue({ ...defaultUseIsReviewerValues, user: null });
      render(<ReviewerSignInSection />);
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('calls supabase.auth.signInWithOAuth and shows loading text when "Sign in" button is clicked', async () => {
      mockUseIsReviewer.mockReturnValue({ ...defaultUseIsReviewerValues, user: null });
      render(<ReviewerSignInSection />);
      fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
      
      // The UI should show "Loading..." because internal signInLoading state is true.
      await waitFor(() => {
         expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
    });

    it('resets loading text if signInWithOAuth returns an error', async () => {
        mockUseIsReviewer.mockReturnValue({ ...defaultUseIsReviewerValues, user: null });
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({ data: {url: null}, error: new Error("OAuth error") });
        render(<ReviewerSignInSection />);
        fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
        await screen.findByText('Loading...'); // Wait for loading to appear
        await waitFor(() => { // Then wait for it to disappear
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('resets loading text if signInWithOAuth returns no URL (user cancellation)', async () => {
        mockUseIsReviewer.mockReturnValue({ ...defaultUseIsReviewerValues, user: null });
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({ data: { provider: 'google', url: null }, error: null });
        render(<ReviewerSignInSection />);
        fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
        await screen.findByText('Loading...'); // Wait for loading to appear
        await waitFor(() => { // Then wait for it to disappear
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('displays loading state from useIsReviewer when reviewerLoading is true', () => {
      (useIsReviewer as jest.Mock).mockReturnValue({ ...defaultUseIsReviewerValues, loading: true });
      render(<ReviewerSignInSection />);
      // The component shows "Loading..." if reviewerLoading OR signInLoading is true
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays error state from useIsReviewer', () => {
      (useIsReviewer as jest.Mock).mockReturnValue({ ...defaultUseIsReviewerValues, error: { message: 'Test error' } });
      render(<ReviewerSignInSection />);
      expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
    });

    it('shows "You are an approved reviewer" if isReviewer is true', () => {
      (useIsReviewer as jest.Mock).mockReturnValue({
        ...defaultUseIsReviewerValues,
        user: { id: 'user1', email: 'reviewer@example.com', user_metadata: {full_name: "Test Reviewer"} },
        isReviewer: true,
        reviewerProfile: { id: 'user1', first_name: 'Approved', last_name: 'Reviewer', reviewer_application_status: 'approved' },
      });
      render(<ReviewerSignInSection />);
      expect(screen.getByText('You are an approved reviewer.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Go to Reviewer Dashboard/i })).toHaveAttribute('href', '/reviewer/dashboard');
    });

    it('shows "Thank you for applying" if profile has status pending and names', () => {
      (useIsReviewer as jest.Mock).mockReturnValue({
        ...defaultUseIsReviewerValues,
        user: { id: 'user1', email: 'pending@example.com', user_metadata: {full_name: "Test Pending"} },
        isReviewer: false,
        reviewerProfile: { id: 'user1', first_name: 'Pending', last_name: 'User', reviewer_application_status: 'pending' },
      });
      render(<ReviewerSignInSection />);
      expect(screen.getByText("Thank you for applying! We'll review your application soon.")).toBeInTheDocument();
    });
    
    describe('ReviewerApplicationModal Display and Flow Logic', () => {
        const baseUser = { id: 'user-modal-test', email: 'modal@example.com', user_metadata: {full_name: "Test Modal User"} };

        // Scenario 1: New user (profile is null) -> Modal shown
        it('shows modal if user is new (reviewerProfile is null)', () => {
            mockUseIsReviewer.mockReturnValue({
                user: baseUser,
                reviewerProfile: null,
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            expect(screen.getByText(`Signed in as ${baseUser.user_metadata.full_name}`)).toBeInTheDocument();
            expect(screen.getByTestId('mock-reviewer-modal')).toBeInTheDocument(); // Check if modal is rendered (isOpen=true)
            expect(ReviewerApplicationModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true, user: baseUser }), {});
            expect(screen.queryByText("Thank you for applying! We'll review your application soon.")).not.toBeInTheDocument();
        });

        // Scenario 2a: Incomplete profile (missing first_name) -> Modal shown
        it('shows modal if profile is missing first_name (and status not approved/pending-complete)', () => {
            mockUseIsReviewer.mockReturnValue({
                user: baseUser,
                reviewerProfile: { id: baseUser.id, last_name: 'Test', reviewer_application_status: 'incomplete' } as any,
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            expect(screen.getByTestId('mock-reviewer-modal')).toBeInTheDocument();
            expect(ReviewerApplicationModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true, user: baseUser }), {});
            expect(screen.queryByText("Thank you for applying! We'll review your application soon.")).not.toBeInTheDocument();
        });

        // Scenario 2b: Incomplete profile (missing last_name) -> Modal shown
        it('shows modal if profile is missing last_name (and status not approved/pending-complete)', () => {
            mockUseIsReviewer.mockReturnValue({
                user: baseUser,
                reviewerProfile: { id: baseUser.id, first_name: 'Test', reviewer_application_status: 'incomplete' } as any,
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            expect(screen.getByTestId('mock-reviewer-modal')).toBeInTheDocument();
            expect(ReviewerApplicationModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true, user: baseUser }), {});
            expect(screen.queryByText("Thank you for applying! We'll review your application soon.")).not.toBeInTheDocument();
        });
        
        // Scenario 3: Complete 'pending' application -> "Thank you" message shown, Modal NOT shown
        it('shows "Thank you" message and NO modal if profile is complete and pending', () => {
            mockUseIsReviewer.mockReturnValue({
                user: baseUser,
                reviewerProfile: { 
                    id: baseUser.id, 
                    first_name: 'Test', 
                    last_name: 'User', 
                    reviewer_application_status: 'pending' 
                } as any,
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            expect(screen.getByText("Thank you for applying! We'll review your application soon.")).toBeInTheDocument();
            expect(screen.queryByTestId('mock-reviewer-modal')).not.toBeInTheDocument();
        });

        // Scenario 4: Approved reviewer -> "You are an approved reviewer" message shown, Modal NOT shown
        // This is already covered by: it('shows "You are an approved reviewer" if isReviewer is true', () => { ... });
        // We can ensure it also checks modal is not shown.
        it('shows "approved reviewer" message and NO modal if isReviewer is true', () => {
            mockUseIsReviewer.mockReturnValue({
                user: baseUser,
                isReviewer: true,
                reviewerProfile: { id: baseUser.id, first_name: 'Approved', last_name: 'Reviewer', reviewer_application_status: 'approved' } as any,
                loading: false, error: null,
            });
            render(<ReviewerSignInSection />);
            expect(screen.getByText('You are an approved reviewer.')).toBeInTheDocument();
            expect(screen.queryByTestId('mock-reviewer-modal')).not.toBeInTheDocument();
        });


        // Scenario 5: Modal is submitted successfully
        it('shows "Thank you" message and hides modal after onSubmitted is called', async () => {
            const userWhoWillApply = { id: 'userApply', email: 'newapplicant@example.com', user_metadata: {full_name: "New Applicant User"} };
            mockUseIsReviewer.mockReturnValue({
                user: userWhoWillApply,
                reviewerProfile: null, // Starts with no profile, so modal will be shown
                isReviewer: false,
                loading: false,
                error: null,
            });
        
            render(<ReviewerSignInSection />);
            
            // Ensure modal is initially shown
            expect(screen.getByTestId('mock-reviewer-modal')).toBeInTheDocument();
            const mockedModal = ReviewerApplicationModal as jest.Mock;
            const initialModalProps = mockedModal.mock.calls[mockedModal.mock.calls.length - 1][0];
            expect(initialModalProps.isOpen).toBe(true);

            // Simulate the onSubmitted callback from the modal
            act(() => {
                initialModalProps.onSubmitted();
            });
            
            // After onSubmitted, the component's internal 'thankYou' state becomes true.
            // This should immediately cause the "Thank you..." message to render,
            // and the modal should be closed (re-rendered with isOpen: false).
            await waitFor(() => {
                expect(screen.getByText("Thank you for applying! We'll review your application soon.")).toBeInTheDocument();
            });
            expect(screen.queryByTestId('mock-reviewer-modal')).not.toBeInTheDocument();
        });
    });
  });
});
// Note: The original test 'shows user email and ReviewerApplicationModal if user is signed in, not reviewer, and no pending application'
// is now covered by 'shows modal if user is new (reviewerProfile is null)'.
// The original test 'shows ReviewerApplicationModal if profile is incomplete and not pending'
// is covered by the more specific 'missing first_name' and 'missing last_name' tests.
// The original test 'shows modal and calls onSubmitted, then updates UI (simulated by changing hook return and re-rendering)'
// has been replaced by 'shows "Thank you" message and hides modal after onSubmitted is called' which more directly tests the UI behavior.
