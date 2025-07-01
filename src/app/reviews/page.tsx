
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
    let allReviews = await getAllReviews();
    const allEvents = await getAllEvents();
    
    // For testing, inject a mock review if no reviews exist
    if (allReviews.length === 0) {
        const mockReview: Review = {
            id: 'mock-review-1',
            showId: 'mock-show-id-1',
            showTitle: 'Lizzie the Musical',
            performanceDate: '2024-07-20',
            reviewerId: 'mock-user-id',
            reviewerName: 'Casey Critic',
            createdAt: new Date().toISOString(),
            overallExperience: "Exceptional & Memorable",
            specialMomentsText: "The lead's performance in the second act was breathtaking. A true masterclass in acting that left the entire audience speechless. The rock score was performed with incredible energy by the band, and the lighting design perfectly captured the show's dark, intense mood.",
            recommendations: ["Date Night", "Dramatic", "Musical"],
            showHeartText: "This was a profound exploration of a historical figure through a modern rock lens. It was challenging, but ultimately very rewarding.",
            communityImpactText: "A story like this is exactly what Eugene needs right now. It opens up important conversations and showcases incredible local talent.",
            ticketInfo: "Paid $35 for a seat in the mezzanine, Row E. The view was excellent for the price.",
            valueConsiderationText: "For the price of a movie ticket and popcorn, you get a live experience that will stick with you for weeks. The production value was outstanding and felt like a bargain.",
            timeWellSpentText: "Absolutely. The show was engaging from start to finish. I'd recommend it to anyone looking for a powerful night of theatre.",
            likes: 12,
            dislikes: 1,
            votedBy: [],
        };
        allReviews.unshift(mockReview);
    }
    
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
