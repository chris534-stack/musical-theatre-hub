
'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scrapeArticleAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ScrapeArticleOutput } from '@/ai/flows/scrape-article';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArticleEditorForm } from '@/components/news/ArticleEditorForm';


const formSchema = z.object({
    url: z.string().url({ message: "Please enter a valid URL." }),
});

export function AddArticleForm({ onSuccess }: { onSuccess: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [prefillData, setPrefillData] = useState<(ScrapeArticleOutput & { url: string }) | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { url: '' },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            const result = await scrapeArticleAction(values.url);
            if (result.success && result.data) {
                setPrefillData(result.data);
                setIsEditorOpen(true);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Scraping failed',
                    description: result.message,
                });
            }
        });
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Article URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/news/article-name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Scrape and Prefill Form
                    </Button>
                </form>
            </Form>
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Review and Add Article</DialogTitle>
                        <DialogDescription>
                            The AI has pre-filled the form with details from the article. Please review and correct before saving.
                        </DialogDescription>
                    </DialogHeader>
                    {prefillData && (
                        <ArticleEditorForm
                            initialData={prefillData}
                            onSuccess={() => {
                                setIsEditorOpen(false);
                                form.reset();
                                onSuccess();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
