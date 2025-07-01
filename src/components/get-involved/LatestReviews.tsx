
import { getAllReviews } from '@/lib/data';
import type { Review } from '@/lib/types';
import { ReviewList } from '@/components/reviews/ReviewList';

export async function LatestReviews() {
    let allReviews = await getAllReviews();
    
    // Inject a mock review for preview purposes on this page
    const mockReview: Review = {
        id: 'mock-review-2', // different id
        showId: 'mock-show-id',
        showTitle: 'A Midsummer Night\'s Dream',
        performanceDate: '2024-07-15',
        reviewerId: 'mock-user-id-2',
        reviewerName: 'Alex Audience',
        createdAt: new Date().toISOString(),
        overallExperience: "Thoroughly Entertaining",
        specialMomentsText: "Puck's comedic timing was impeccable! The magical forest set was also a highlight, truly transporting.",
        recommendations: ["Family-Friendly", "Comedic"],
        showHeartText: "A classic tale of love and mischief, perfectly executed. It's a joyful, lighthearted escape.",
        communityImpactText: "It's wonderful to see a classic performed with such energy. A great introduction to Shakespeare for newcomers.",
        ticketInfo: "Got a student discount ticket for $20 in the balcony. A bit far but still a good experience.",
        valueConsiderationText: "Great value. The quality of the acting and costumes were top-notch for a community theatre production.",
        timeWellSpentText: "Yes, a fun and laughter-filled evening. Perfect for a summer night out.",
        likes: 8,
        dislikes: 0,
        votedBy: [],
    };
    
    // Add mock review to the list if no other reviews exist
    if (allReviews.length === 0) {
        allReviews.unshift(mockReview);
    }

    // Show the latest 3 reviews
    const latestReviews = allReviews.slice(0, 3);

    return <ReviewList reviews={latestReviews} />;
}
