'use client';

import { useState, useTransition } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SignInPromptModal from '@/components/SignInPromptModal';
import { requestToBeReviewerAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export function ReviewerRequestForm() {
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    startTransition(async () => {
      const result = await requestToBeReviewerAction({
        userId: user.uid,
        userName: user.displayName || 'N/A',
        userEmail: user.email || 'N/A',
      });
      if (result.success) {
        toast({
          title: 'Request Sent!',
          description: "Thank you for your interest! We'll be in touch soon.",
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Request Failed',
          description: result.message,
        });
      }
    });
  };

  return (
    <>
      <Button onClick={handleSubmit} disabled={isPending} className="mt-auto">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit My Interest
      </Button>
      <SignInPromptModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        title="Sign in to Continue"
        description="Please sign in to express your interest in becoming a reviewer."
      />
    </>
  );
}
