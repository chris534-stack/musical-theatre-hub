
import type { Review } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { format } from 'date-fns';

export function ReviewPreviewCard({ review }: { review: Review }) {
    const snippet = review.specialMomentsText.length > 150 
        ? review.specialMomentsText.substring(0, 150) + '...'
        : review.specialMomentsText;

    return (
        <Dialog>
            <DialogTrigger asChild>
                 <Card className="flex flex-col h-full cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                             <div className="flex-1">
                                <CardTitle className="text-base font-semibold">{review.reviewerName}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Reviewed on {format(new Date(review.performanceDate), "MMM d, yyyy")}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-center shrink-0">{review.overallExperience}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground italic">"{snippet}"</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <ThumbsUp className="h-4 w-4"/> {review.likes}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <ThumbsDown className="h-4 w-4"/> {review.dislikes}
                            </span>
                        </div>
                        <span className="font-semibold text-primary">Read More &rarr;</span>
                    </CardFooter>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
                <div className="max-h-[85vh] overflow-y-auto pr-6">
                    <ReviewCard review={review} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
