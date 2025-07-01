
'use client';

import { useState, useTransition } from 'react';
import type { Review } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { voteOnReviewAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

function ReviewSection({ title, content }: { title: string, content: React.ReactNode }) {
    if (!content) return null;
    return (
        <div>
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">{content}</p>
        </div>
    )
}

export function ReviewCard({ review }: { review: Review }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [localLikes, setLocalLikes] = useState(review.likes || 0);
    const [localDislikes, setLocalDislikes] = useState(review.dislikes || 0);
    const [voted, setVoted] = useState<'like' | 'dislike' | null>(null);

    const handleVote = (voteType: 'like' | 'dislike') => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: "Login Required",
                description: "You must be signed in to vote on reviews."
            });
            return;
        }

        if (voted || (review.votedBy || []).includes(user.uid)) {
            toast({
                title: "Already Voted",
                description: "You can only vote once per review."
            });
            return;
        }
        
        setVoted(voteType);
        if (voteType === 'like') {
            setLocalLikes(p => p + 1);
        } else {
            setLocalDislikes(p => p + 1);
        }

        startTransition(async () => {
            await voteOnReviewAction(review.id, voteType, user.uid);
            // No need to toast success, it's an implicit action
        });
    }

    const hasVoted = voted || (user && (review.votedBy || []).includes(user.uid));

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{review.reviewerName}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            Reviewed performance on {new Date(review.performanceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary">{review.overallExperience}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {review.recommendations?.map(rec => <Badge key={rec} variant="outline">{rec}</Badge>)}
                </div>

                <ReviewSection title="What made this performance special?" content={review.specialMomentsText} />
                <ReviewSection title="The Heart of the Show" content={review.showHeartText} />
                <ReviewSection title="Is this show important for Eugene right now?" content={review.communityImpactText} />
                
                <Separator />

                <ReviewSection title="Ticket & Seat Info" content={review.ticketInfo} />
                <ReviewSection title="Production Value & Admission" content={review.valueConsiderationText} />
                <ReviewSection title="A Rewarding Evening?" content={review.timeWellSpentText} />

            </CardContent>
            <CardFooter className="flex justify-end items-center gap-4">
                <span className="text-sm text-muted-foreground">Helpful?</span>
                <Button 
                    variant={voted === 'like' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => handleVote('like')} 
                    disabled={isPending || !!hasVoted}
                >
                    <ThumbsUp className="mr-2 h-4 w-4" /> {localLikes}
                </Button>
                <Button 
                    variant={voted === 'dislike' ? 'destructive' : 'outline'} 
                    size="sm" 
                    onClick={() => handleVote('dislike')}
                    disabled={isPending || !!hasVoted}
                >
                    <ThumbsDown className="mr-2 h-4 w-4" /> {localDislikes}
                </Button>
            </CardFooter>
        </Card>
    );
}
