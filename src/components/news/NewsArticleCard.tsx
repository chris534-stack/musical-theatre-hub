
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NewsArticle } from '@/lib/types';
import { ArrowRight, GripVertical } from 'lucide-react';

export function NewsArticleCard({ article, dragHandleProps }: { article: NewsArticle, dragHandleProps?: any }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-lg h-full">
        <div className="relative group">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
                {article.imageUrl ? (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint="news article"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                        />
                    </div>
                ) : (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg bg-secondary flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No Image Available</p>
                    </div>
                )}
            </a>
            {dragHandleProps && (
                <div {...dragHandleProps} className="absolute top-2 right-2 bg-black/30 text-white/80 rounded-md p-2 cursor-grab active:cursor-grabbing hover:bg-black/50 hover:text-white transition-colors">
                    <GripVertical className="h-5 w-5" />
                </div>
            )}
        </div>
        <CardHeader>
            <CardTitle className="font-headline text-lg leading-tight">
                 <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary/80">
                    {article.title}
                </a>
            </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <CardDescription>{article.summary}</CardDescription>
        </CardContent>
        <CardFooter>
            <Button asChild variant="link" className="p-0">
                <Link href={article.url} target="_blank" rel="noopener noreferrer">
                    Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
  )
}
