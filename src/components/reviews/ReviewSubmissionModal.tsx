
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import type { ExpandedCalendarEvent } from '@/lib/types';
import { toTitleCase } from '@/lib/utils';

interface ReviewSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: ExpandedCalendarEvent | null;
}

export function ReviewSubmissionModal({ isOpen, onClose, event }: ReviewSubmissionModalProps) {
    if (!event) return null;

    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Reviewing: {toTitleCase(event.title)}</DialogTitle>
                    <DialogDescription>
                        Performance Date: {formattedDate}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[75vh] overflow-y-auto pr-6">
                    <ReviewForm event={event} onSuccess={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
