
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { addNewsArticleAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    url: z.string().url({ message: "Please enter a valid URL." }),
});

export function AddArticleForm({ onSuccess }: { onSuccess: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { url: '' },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            const result = await addNewsArticleAction(values.url);
            if (result.success) {
                toast({
                    title: 'Article Added',
                    description: 'The news article has been successfully added.',
                });
                form.reset();
                onSuccess();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to add article',
                    description: result.message,
                });
            }
        });
    };

    return (
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
                    Scrape and Add Article
                </Button>
            </form>
        </Form>
    );
}
