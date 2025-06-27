
import { AddArticleButton } from '@/components/news/AddArticleButton';
import { getAllNewsArticles } from '@/lib/data';
import { NewsList } from '@/components/news/NewsList';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
    const articles = await getAllNewsArticles();

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-headline text-primary">News & Reviews</h1>
                <p className="text-muted-foreground mt-2">The latest news and reviews from the Eugene theatre scene.</p>
            </div>
            
            <NewsList initialArticles={articles} />

            <AddArticleButton />
        </div>
    );
}
