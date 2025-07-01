
'use client';

import type { Review } from '@/lib/types';
import { ReviewCard } from './ReviewCard';
import { MessageSquareText } from 'lucide-react';

export function ReviewList({ reviews }: { reviews: Review[] }) {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <MessageSquareText className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">No Reviews Yet</p>
                <p className="text-sm">Be the first to share your thoughts on this show!</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-headline text-primary">Community Reviews ({reviews.length})</h3>
            {reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
            ))}
        </div>
    );
}
