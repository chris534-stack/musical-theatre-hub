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

      let callCount = 0;
      jest.spyOn(React, 'useState').mockImplementation((initialValue) => {
        if (callCount === 0) { // Assuming showModal is the first boolean useState
          callCount++;
          return [mockStates.showModal, mockSetters.setShowModal];
        } if (callCount === 1) { // Assuming thankYou is the second
          callCount++;
          return [mockStates.thankYou, mockSetters.setThankYou];
        } if (callCount === 2) { // Assuming signInLoading is the third
            callCount = 0; // Reset for next test if component re-mounts
            return [mockStates.signInLoading, mockSetters.setSignInLoading];
        }
        // Fallback for any other useStates
        return [initialValue, jest.fn()];
      });
      mockSetShowModal.mockClear();
      mockSetters.setSignInLoading.mockClear();
      mockSetters.setThankYou.mockClear();
    });
    
    afterEach(() => {
        jest.restoreAllMocks(); // Clean up spies
    });

    it('renders Sign in with Google button when not authenticated', () => {
      render(<ReviewerSignInSection />);
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('calls supabase.auth.signInWithOAuth when "Sign in" button is clicked', async () => {
      // Specific mock for useState for signInLoading for this test
      const setSignInLoadingMock = jest.fn();
      const setShowModalMock = jest.fn(); // for showModal
      const setThankYouMock = jest.fn(); // for thankYou

      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [false, setShowModalMock]) // showModal
        .mockImplementationOnce(() => [false, setThankYouMock])  // thankYou
        .mockImplementationOnce(() => [false, setSignInLoadingMock]); // signInLoading
      
      render(<ReviewerSignInSection />);
      fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
      
      expect(setSignInLoadingMock).toHaveBeenCalledWith(true);
      // The UI should show "Loading..." because signInLoading is true
      // Note: The actual text "Loading..." is rendered if `reviewerLoading || signInLoading` is true.
      // Here, useIsReviewer().loading (reviewerLoading) is false.
      await waitFor(() => {
         expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
    });

    it('resets loading state if signInWithOAuth returns an error', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({ data: {}, error: new Error("OAuth error") });
        render(<ReviewerSignInSection />);
        fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('resets loading state if signInWithOAuth returns no URL (user cancellation)', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({ data: { provider: 'google', url: null }, error: null });
        render(<ReviewerSignInSection />);
        fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('displays loading state from useIsReviewer', () => {
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
    
    describe('ReviewerApplicationModal Display Logic', () => {
        const baseUser = { id: 'user-modal-test', email: 'modal@example.com', user_metadata: {full_name: "Test Modal User"} };

        it('shows modal if user exists, not reviewer, and reviewerProfile is null', () => {
            (useIsReviewer as jest.Mock).mockReturnValue({
                user: baseUser,
                reviewerProfile: null,
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            expect(ReviewerApplicationModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true }), {});
        });

        it('shows modal if user exists, not reviewer, profile exists but first_name is missing', () => {
            (useIsReviewer as jest.Mock).mockReturnValue({
                user: baseUser,
                reviewerProfile: { id: baseUser.id, last_name: 'Test', reviewer_application_status: 'incomplete' },
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            expect(ReviewerApplicationModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true }), {});
        });

        it('shows modal if user exists, not reviewer, profile exists but last_name is missing', () => {
            (useIsReviewer as jest.Mock).mockReturnValue({
                user: baseUser,
                reviewerProfile: { id: baseUser.id, first_name: 'Test', reviewer_application_status: 'incomplete' },
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            expect(ReviewerApplicationModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true }), {});
        });

        it('does NOT show modal if profile is complete but status is "rejected"', () => {
            (useIsReviewer as jest.Mock).mockReturnValue({
                user: baseUser,
                reviewerProfile: { id: baseUser.id, first_name: 'Test', last_name: 'User', reviewer_application_status: 'rejected' },
                isReviewer: false,
                loading: false,
                error: null,
            });
            render(<ReviewerSignInSection />);
            const modalCalls = (ReviewerApplicationModal as jest.Mock).mock.calls;
            if (modalCalls.length > 0) {
                 expect(ReviewerApplicationModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: false }), {});
            }
             // If not called at all, or called with isOpen: false, it passes.
             // This ensures it's not called with isOpen: true for this case.
        });


        it('shows modal and calls onSubmitted, then updates UI (simulated by changing hook return and re-rendering)', async () => {
            const user = { id: 'user1', email: 'new@example.com', user_metadata: {full_name: "New User Test"} };
            // Initial state: needs to apply
            (useIsReviewer as jest.Mock).mockReturnValue({ 
                user,
                reviewerProfile: null,
                isReviewer: false,
                loading: false,
                error: null,
            });
        
            const { rerender } = render(<ReviewerSignInSection />);
        
            // Modal should be open
            expect(ReviewerApplicationModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: true, user }), {});
        
            // Simulate modal submission by finding the mocked modal's onSubmitted prop and calling it
            let modalProps = (ReviewerApplicationModal as jest.Mock).mock.calls.find(call => call[0].isOpen)?.[0];
            expect(modalProps).toBeDefined();
            
            // Ensure React.useState for 'thankYou' is mocked to capture setThankYou
            const setThankYouMock = jest.fn();
            const originalUseState = React.useState;
            jest.spyOn(React, 'useState').mockImplementation((initialValue) => {
                 if (typeof initialValue === 'boolean') {
                    // Assuming the second boolean useState is 'thankYou'
                    // This is fragile; order of useState calls matters.
                    // For ReviewerSignInSection: showModal, thankYou, signInLoading
                    const stateSetters = (React.useState as jest.Mock).mock.calls.length;
                    if(stateSetters === 1) return [false, setThankYouMock]; // Matches thankYou
                 }
                 return originalUseState(initialValue); // Call original for others
            });

            if (modalProps && modalProps.onSubmitted) {
                 modalProps.onSubmitted(); // This should trigger setThankYou(true)
            }
            expect(setThankYouMock).toHaveBeenCalledWith(true); // Verify setThankYou was called

            // Restore original useState to avoid interference with other tests or internal RTL workings
            jest.spyOn(React, 'useState').mockImplementation(originalUseState);


            // Now, mock useIsReviewer to return the state *after* application is submitted (pending)
            // This simulates the hook re-running and finding the new pending application.
            (useIsReviewer as jest.Mock).mockReturnValue({
                user,
                reviewerProfile: { id: user.id, first_name: 'Submitted', last_name: 'User', reviewer_application_status: 'pending' },
                isReviewer: false,
                loading: false,
                error: null,
            });
            
            // Re-render the component. In a real app, the hook update or state change would cause this.
            rerender(<ReviewerSignInSection />);
        
            // UI should now show "Thank you for applying..."
            // And the modal should be closed.
            await waitFor(() => {
                expect(screen.getByText("Thank you for applying! We'll review your application soon.")).toBeInTheDocument();
            });
            // Check that the modal is now called with isOpen: false
            expect(ReviewerApplicationModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: false, user }), {});
        });
    });
  });
});
