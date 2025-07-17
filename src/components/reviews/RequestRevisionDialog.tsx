
'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestReviewRevisionAction } from '@/lib/actions';
import type { Review } from '@/lib/types';

interface RequestRevisionDialogProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestRevisionDialog({ review, isOpen, onClose, onSuccess }: RequestRevisionDialogProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!adminNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Feedback Required',
        description: 'Please provide some notes for the user.',
      });
      return;
    }

    startTransition(async () => {
      const result = await requestReviewRevisionAction(review.id, adminNotes);
      if (result.success) {
        toast({
          title: 'Revision Requested',
          description: "The user has been notified to revise their review.",
        });
        onSuccess();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Revision for Review</DialogTitle>
          <DialogDescription>
            Provide feedback to the user on what needs to be changed in their review. This will send it back to them for editing.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="adminNotes">Feedback for User</Label>
          <Textarea
            id="adminNotes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="e.g., 'Please remove the personal attack in the first paragraph. Constructive criticism is welcome, but personal insults are not permitted.'"
            rows={5}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
