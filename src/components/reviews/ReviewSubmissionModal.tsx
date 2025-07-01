
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import type { ExpandedCalendarEvent } from '@/app/calendar/page';
import { toTitleCase } from '@/lib/utils';
import { format } from 'date-fns';

interface ReviewSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: ExpandedCalendarEvent | null;
}

export function ReviewSubmissionModal({ isOpen, onClose, event }: ReviewSubmissionModalProps) {
    if (!event) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Reviewing: {toTitleCase(event.title)}</DialogTitle>
                    <DialogDescription>
                        Performance Date: {format(new Date(event.date), "MMMM d, yyyy")}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[75vh] overflow-y-auto pr-6">
                    <ReviewForm event={event} onSuccess={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
