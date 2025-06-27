
import { AddArticleButton } from '@/components/news/AddArticleButton';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-headline text-primary">News & Reviews</h1>
                <p className="text-muted-foreground mt-2">The latest news and reviews from the Eugene theatre scene.</p>
            </div>

            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <p className="font-semibold">No News Yet</p>
                <p className="text-sm">Check back later for news and reviews. Admins can add articles using the button below.</p>
            </div>
            
            <AddArticleButton />
        </div>
    );
}
