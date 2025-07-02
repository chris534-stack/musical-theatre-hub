'use client';

import type { Review } from '@/lib/types';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Badge } from '@/components/ui/badge';
import { toTitleCase } from '@/lib/utils';
import Link from 'next/link';

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
                            <p className="font-semibold text-sm">
                                <Link href={`/profile/${review.reviewerId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {review.reviewerName}
                                </Link>
                            </p>
                            <Badge variant="secondary" className="mt-1 text-xs text-center">{review.overallExperience}</Badge>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{snippet}"</p>
                    <p className="text-xs text-primary font-semibold text-right mt-2">Read full review &rarr;</p>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle>Review for {toTitleCase(review.showTitle)}</DialogTitle>
                    <DialogDescription>By {review.reviewerName}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto pr-4">
                    <ReviewCard review={review} hideHeader />
                </div>
            </DialogContent>
        </Dialog>
    );
}
