
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewerRequestForm } from '@/components/reviews/ReviewerRequestForm';

export function BecomeReviewerCTA() {
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
