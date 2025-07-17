
'use client';

import { useState, useTransition } from 'react';
import type { Review } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { voteOnReviewAction, deleteReviewAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SignInPromptModal from '@/components/SignInPromptModal';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function ReviewSection({ title, content }: { title: string, content: React.ReactNode }) {
    if (!content) return null;
    return (
        <div>
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">{content}</p>
        </div>
    )
}

export function ReviewCard({ review, hideHeader = false, onReviewDeleted }: { review: Review, hideHeader?: boolean, onReviewDeleted?: () => void }) {
    const { user, isAdmin } = useAuth();
    const { toast } = useToast();
    const [votePending, startVoteTransition] = useTransition();
    const [deletePending, startDeleteTransition] = useTransition();

    const [localLikes, setLocalLikes] = useState(review.likes || 0);
    const [localDislikes, setLocalDislikes] = useState(review.dislikes || 0);
    const [voted, setVoted] = useState<'like' | 'dislike' | null>(null);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);


    const handleVote = (voteType: 'like' | 'dislike') => {
        if (!user) {
            setShowSignInModal(true);
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

        startVoteTransition(async () => {
            await voteOnReviewAction(review.id, voteType, user.uid);
            // No need to toast success, it's an implicit action
        });
    }

    const handleDelete = () => {
        startDeleteTransition(async () => {
            const result = await deleteReviewAction(review.id);
            if (result.success) {
                toast({ title: "Success", description: "Review has been deleted." });
                if (onReviewDeleted) {
                    onReviewDeleted();
                }
            } else {
                toast({ variant: 'destructive', title: "Error", description: result.message });
            }
            setIsAlertOpen(false);
        });
    }

    const hasVoted = voted || (user && (review.votedBy || []).includes(user.uid));

    return (
        <>
            <Card className="relative">
                {isAdmin && (
                    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={() => setIsAlertOpen(true)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this review.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={deletePending}>
                                    {deletePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {!hideHeader && (
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base">
                                     <Link href={`/profile/${review.reviewerId}`} className="hover:underline">
                                        {review.reviewerName}
                                    </Link>
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Reviewed performance on {new Date(review.performanceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">{review.overallExperience}</Badge>
                        </div>
                    </CardHeader>
                )}
                <CardContent className={cn("space-y-4", hideHeader && "pt-6")}>
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
                    
                    {review.disclosureText && (
                        <>
                            <Separator />
                            <ReviewSection title="Transparency Disclosure" content={review.disclosureText} />
                        </>
                    )}

                </CardContent>
                <CardFooter className="flex justify-end items-center gap-4">
                    <span className="text-sm text-muted-foreground">Helpful?</span>
                    <Button 
                        variant={voted === 'like' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => handleVote('like')} 
                        disabled={votePending || !!hasVoted}
                    >
                        <ThumbsUp className="mr-2 h-4 w-4" /> {localLikes}
                    </Button>
                    <Button 
                        variant={voted === 'dislike' ? 'destructive' : 'outline'} 
                        size="sm" 
                        onClick={() => handleVote('dislike')}
                        disabled={votePending || !!hasVoted}
                    >
                        <ThumbsDown className="mr-2 h-4 w-4" /> {localDislikes}
                    </Button>
                </CardFooter>
            </Card>
            <SignInPromptModal
                isOpen={showSignInModal}
                onClose={() => setShowSignInModal(false)}
                title="Login Required"
                description="You must be signed in to vote on reviews."
            />
        </>
    );
}
