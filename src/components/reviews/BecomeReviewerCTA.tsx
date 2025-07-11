
'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewerRequestForm } from '@/components/reviews/ReviewerRequestForm';
import { Button } from '@/components/ui/button';
import { CalendarSearch } from 'lucide-react';

export function BecomeReviewerCTA() {
    const { isReviewer } = useAuth();

    if (isReviewer) {
        return (
            <Card className="bg-secondary/50 border-accent/20 shadow-lg">
                <div className="grid md:grid-cols-2 items-center">
                     <CardHeader>
                        <CardTitle className="text-2xl font-headline text-accent">You're a Reviewer!</CardTitle>
                        <CardDescription className="text-muted-foreground mt-4">
                            Find a past show on the calendar to share your thoughts and contribute to the community conversation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 md:pt-0 flex items-center justify-center">
                         <Button asChild size="lg" className="w-full max-w-xs">
                            <Link href="/calendar">
                                <CalendarSearch className="mr-2 h-5 w-5" />
                                Find a Show to Review
                            </Link>
                         </Button>
                    </CardContent>
                </div>
            </Card>
        )
    }

    return (
        <Card className="bg-secondary/50 border-accent/20 shadow-lg">
            <div className="grid md:grid-cols-2 items-center">
                 <CardHeader>
                    <CardTitle className="text-2xl font-headline text-accent">Become a Community Reviewer</CardTitle>
                    <CardDescription className="text-muted-foreground mt-4 space-y-3">
                        <p>
                        Love theatre? Have a thoughtful perspective? Represent the voice of our community and help enrich the Eugene theatre scene.
                        </p>
                        <p>
                        Your insights support local artists and help others discover great shows.
                        </p>
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 md:pt-0 flex items-center justify-center">
                    <ReviewerRequestForm />
                </CardContent>
            </div>
        </Card>
    )
}
