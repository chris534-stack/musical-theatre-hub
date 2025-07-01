
import { getAllReviews, getAllEvents } from '@/lib/data';
import type { Review, Event } from '@/lib/types';
import { BecomeReviewerCTA } from '@/components/reviews/BecomeReviewerCTA';
import { ReviewPreviewCard } from '@/components/reviews/ReviewPreviewCard';
import { toTitleCase } from '@/lib/utils';

type GroupedReviews = {
    [showId: string]: {
        showTitle: string;
        reviews: Review[];
    }
}

function groupReviewsByShow(reviews: Review[], events: Event[]): GroupedReviews {
    const eventMap = new Map<string, string>(events.map(e => [e.id, e.title]));
    const grouped: GroupedReviews = {};

    reviews.forEach(review => {
        if (!grouped[review.showId]) {
            grouped[review.showId] = {
                showTitle: toTitleCase(eventMap.get(review.showId) || review.showTitle),
                reviews: []
            };
        }
        grouped[review.showId].reviews.push(review);
    });
    
    // Sort reviews within each group by likes
    for (const showId in grouped) {
        grouped[showId].reviews.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return grouped;
}

export default async function ReviewsPage() {
    const [allReviews, allEvents] = await Promise.all([
        getAllReviews(),
        getAllEvents()
    ]);
    
    const groupedReviews = groupReviewsByShow(allReviews, allEvents);
    const sortedShowIds = Object.keys(groupedReviews).sort((a,b) => {
        const latestReviewA = new Date(groupedReviews[a].reviews[0].createdAt).getTime();
        const latestReviewB = new Date(groupedReviews[b].reviews[0].createdAt).getTime();
        return latestReviewB - latestReviewA;
    });

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-3">Community Reviews</h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    The conversation about Eugene's theatre scene, straight from the audience.
                </p>
            </div>

            <div className="mb-16">
                <BecomeReviewerCTA />
            </div>

            <div className="space-y-12">
                {sortedShowIds.length > 0 ? (
                    sortedShowIds.map(showId => {
                        const group = groupedReviews[showId];
                        return (
                            <section key={showId}>
                                <h2 className="text-3xl font-bold font-headline text-primary mb-6">
                                    Reviews for <span className="text-accent">{group.showTitle}</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {group.reviews.map(review => (
                                        <ReviewPreviewCard key={review.id} review={review} />
                                    ))}
                                </div>
                            </section>
                        )
                    })
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                         <p className="font-semibold text-lg text-muted-foreground">No Reviews Yet</p>
                         <p className="text-muted-foreground mt-2">Check back later for community thoughts on local shows!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
