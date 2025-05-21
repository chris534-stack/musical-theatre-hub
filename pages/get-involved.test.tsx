import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Assuming ReviewerSignInSection is exported from GetInvolved or can be isolated.
// If GetInvolved directly renders ReviewerSignInSection and it's hard to isolate,
// we might need to render GetInvolved and target ReviewerSignInSection's content.
// For this example, let's assume ReviewerSignInSection can be tested more directly,
// or we are testing the part of GetInvolved that uses it.
import GetInvolved, { ReviewerSignInSection } from './get-involved'; // Adjust if ReviewerSignInSection is not directly exported
import useIsReviewer from '../components/useIsReviewer';
import { supabase } from '../lib/supabaseClient';
import ReviewerApplicationModal from '../components/ReviewerApplicationModal';

// Mock dependencies
jest.mock('../components/useIsReviewer');
jest.mock('../lib/supabaseClient');
jest.mock('../components/ReviewerApplicationModal', () => ({
  __esModule: true,
  default: jest.fn(({ isOpen, onClose, user, onSubmitted }) => // Mocked component
    isOpen ? (
      <div data-testid="mocked-reviewer-modal">
        Mocked Reviewer Application Modal for {user?.email}
        <button onClick={onClose}>Close Modal</button>
        <button onClick={onSubmitted}>Submit Modal</button>
      </div>
    ) : null
  ),
}));


const mockUseIsReviewer = useIsReviewer as jest.MockedFunction<typeof useIsReviewer>;

describe('ReviewerSignInSection (within GetInvolved page)', () => {
  beforeEach(() => {
    mockUseIsReviewer.mockReset();
    supabase.resetMocks();
    (ReviewerApplicationModal as jest.Mock).mockClear();
  });

  // Helper to render the section, assuming GetInvolved renders it.
  // If ReviewerSignInSection is a direct export, can render it alone.
  const renderGetInvolvedPage = () => {
    // We render GetInvolved because ReviewerSignInSection is deeply nested
    // and its behavior is part of the GetInvolved page.
    // We will use screen queries that target elements specific to ReviewerSignInSection.
    render(<GetInvolved />);
  };
  
  it('shows loading state from useIsReviewer', () => {
    mockUseIsReviewer.mockReturnValue({
      user: null,
      isReviewer: false,
      reviewerProfile: null,
      loading: true,
      error: null,
    });
    renderGetInvolvedPage();
    // Look for text that ReviewerSignInSection would render in loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument(); 
  });

  it('shows error state from useIsReviewer', () => {
    const errorMessage = 'Failed to connect';
    mockUseIsReviewer.mockReturnValue({
      user: null,
      isReviewer: false,
      reviewerProfile: null,
      loading: false,
      error: { message: errorMessage },
    });
    renderGetInvolvedPage();
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
  });

  it('shows "Sign in with Google" button when user is not authenticated', () => {
    mockUseIsReviewer.mockReturnValue({
      user: null,
      isReviewer: false,
      reviewerProfile: null,
      loading: false,
      error: null,
    });
    renderGetInvolvedPage();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
  });

  it('calls supabase.auth.signInWithOAuth when "Sign in" button is clicked', async () => {
    mockUseIsReviewer.mockReturnValue({
      user: null,
      isReviewer: false,
      reviewerProfile: null,
      loading: false,
      error: null,
    });
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null }); // Mock the sign-in call
    
    renderGetInvolvedPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    // Expect loading state to appear after click, before Supabase redirect (if not immediate)
    // Since useIsReviewer would typically handle loading after redirect, this might be tricky
    // For now, we just check the call.
    // await waitFor(() => expect(screen.getByText('Loading...')).toBeInTheDocument()); // if signInLoading state is set
  });
  
  it('shows "You are an approved reviewer" message if isReviewer is true', () => {
    mockUseIsReviewer.mockReturnValue({
      user: { id: 'user1', email: 'reviewer@example.com', user_metadata: { full_name: 'Approved Reviewer'} },
      isReviewer: true,
      reviewerProfile: { reviewer_application_status: 'approved' } as any,
      loading: false,
      error: null,
    });
    renderGetInvolvedPage();
    expect(screen.getByText('You are an approved reviewer.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Reviewer Dashboard/i })).toHaveAttribute('href', '/reviewer/dashboard');
  });

  it('shows "Thank you for applying" message if application is pending', () => {
    mockUseIsReviewer.mockReturnValue({
      user: { id: 'user2', email: 'pending@example.com', user_metadata: { full_name: 'Pending Reviewer'} },
      isReviewer: false,
      reviewerProfile: { reviewer_application_status: 'pending' } as any,
      loading: false,
      error: null,
    });
    renderGetInvolvedPage();
    expect(screen.getByText("Thank you for applying! We'll review your application soon.")).toBeInTheDocument();
  });

  it('shows user email and ReviewerApplicationModal if user is signed in, not reviewer, and no pending application', () => {
    const mockUser = { id: 'user3', email: 'applicant@example.com', user_metadata: { full_name: 'New Applicant'} };
    mockUseIsReviewer.mockReturnValue({
      user: mockUser,
      isReviewer: false,
      reviewerProfile: null, // No profile yet, or incomplete that leads to modal
      loading: false,
      error: null,
    });
    
    renderGetInvolvedPage();
    
    expect(screen.getByText(`Signed in as ${mockUser.user_metadata.full_name}`)).toBeInTheDocument();
    // The modal itself is mocked, check if it's rendered (which means isOpen was true)
    // The logic for showModal is inside ReviewerSignInSection's useEffect.
    // We need to ensure the conditions in that useEffect are met by our mockReturnValue.
    // Specifically: user is present, !isReviewer, reviewerProfile is null, not loading, not thankYou state
    expect(screen.getByTestId('mocked-reviewer-modal')).toBeInTheDocument();
    expect(ReviewerApplicationModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true, // This is the key check
        user: mockUser,
      }),
      {}
    );
  });

   it('ReviewerApplicationModal onSubmitted sets thankYou state and hides modal', async () => {
    const mockUser = { id: 'user4', email: 'justapplied@example.com', user_metadata: { full_name: 'Just Applied'} };
    mockUseIsReviewer.mockReturnValue({
      user: mockUser,
      isReviewer: false,
      reviewerProfile: null, 
      loading: false,
      error: null,
    });

    renderGetInvolvedPage();

    // Initially, modal should be open
    expect(screen.getByTestId('mocked-reviewer-modal')).toBeInTheDocument();
    
    // Find the submit button in the mocked modal and click it
    const submitButtonInModal = screen.getByRole('button', { name: 'Submit Modal' });
    fireEvent.click(submitButtonInModal);

    // After submission, the modal should close, and "thank you" message should appear.
    // The useIsReviewer hook would then update, but we are testing the immediate UI change.
    await waitFor(() => {
      expect(screen.queryByTestId('mocked-reviewer-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByText("Thank you for applying! We'll review your application soon.")).toBeInTheDocument();
  });

  // Test for incomplete profile that should also show the modal
  it('shows ReviewerApplicationModal if profile is incomplete and not pending', () => {
    const mockUser = { id: 'user5', email: 'incomplete@example.com', user_metadata: { full_name: 'Incomplete Profile'} };
    mockUseIsReviewer.mockReturnValue({
      user: mockUser,
      isReviewer: false,
      reviewerProfile: { 
        id: mockUser.id, 
        // Missing first_name or last_name or status to be considered incomplete by the component's logic
        reviewer_application_status: 'some_other_status' 
      } as any,
      loading: false,
      error: null,
    });

    renderGetInvolvedPage();

    expect(screen.getByText(`Signed in as ${mockUser.user_metadata.full_name}`)).toBeInTheDocument();
    expect(screen.getByTestId('mocked-reviewer-modal')).toBeInTheDocument();
    expect(ReviewerApplicationModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        user: mockUser,
      }),
      {}
    );
  });


});
