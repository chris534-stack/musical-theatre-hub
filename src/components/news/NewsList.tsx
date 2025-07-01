'use client';

import { useState, useTransition, useEffect } from 'react';
import { DragDropContext, Draggable, type OnDragEndResponder } from '@hello-pangea/dnd';
import { StrictModeDroppable } from './StrictModeDroppable';
import { NewsArticleCard } from '@/components/news/NewsArticleCard';
import type { NewsArticle } from '@/lib/types';
import { updateNewsArticleOrderAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function NewsList({ initialArticles }: { initialArticles: NewsArticle[] }) {
    const [articles, setArticles] = useState(initialArticles);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // This effect synchronizes the state with the server-fetched props.
    // It's useful for when new articles are added and the page re-renders.
    useEffect(() => {
        setArticles(initialArticles);
    }, [initialArticles]);

    const onDragEnd: OnDragEndResponder = (result) => {
        const { source, destination } = result;
        if (!destination) {
            return;
        }

        const items = Array.from(articles);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        setArticles(items);
        
        const orderedIds = items.map(item => item.id);
        
        startTransition(async () => {
            const res = await updateNewsArticleOrderAction(orderedIds);
            if (res.success) {
                toast({ title: "Order Updated", description: "The news article order has been saved." });
            } else {
                toast({ variant: 'destructive', title: "Update Failed", description: res.message });
                // Revert to original order on failure
                setArticles(initialArticles);
            }
        });
    };
    
    if (articles.length === 0) {
        return (
             <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <p className="font-semibold">No News Yet</p>
                <p className="text-sm">Check back later for news and reviews. Admins can add articles using the button below.</p>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="articles">
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {articles.map((article, index) => (
                            <Draggable key={article.id} draggableId={article.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={provided.draggableProps.style}
                                        className={snapshot.isDragging ? 'shadow-2xl' : ''}
                                    >
                                        <NewsArticleCard article={article} dragHandleProps={provided.dragHandleProps} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </StrictModeDroppable>
        </DragDropContext>
    );
}
