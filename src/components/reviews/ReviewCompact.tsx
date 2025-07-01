'use client';

import type { Review } from '@/lib/types';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Badge } from '@/components/ui/badge';

export function ReviewCompact({ review }: { review: Review }) {
    const snippet = review.specialMomentsText.length > 100
        ? review.specialMomentsText.substring(0, 100) + '...'
        : review.specialMomentsText;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="p-3 rounded-lg border bg-background cursor-pointer hover:bg-muted/50 transition-colors w-full text-left">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                            <p className="font-semibold text-sm">{review.reviewerName}</p>
                            <Badge variant="secondary" className="mt-1 text-xs text-center">{review.overallExperience}</Badge>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{snippet}"</p>
                    <p className="text-xs text-primary font-semibold text-right mt-2">Read full review &rarr;</p>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
                <div className="max-h-[85vh] overflow-y-auto pr-6">
                    <ReviewCard review={review} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
