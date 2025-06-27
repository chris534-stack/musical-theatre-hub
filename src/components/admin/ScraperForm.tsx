
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scrapeEventAction } from '@/lib/actions';
import { Loader2, Paperclip, ClipboardPaste } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  screenshot: z.any()
    .refine((files) => files?.length == 1, "A screenshot image is required.")
    .refine((files) => files?.[0]?.type.startsWith("image/"), "Only image files are accepted."),
});

export function ScraperForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: '' },
  });

  const screenshotFile = form.watch('screenshot');
  const fileName = screenshotFile?.[0]?.name;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const file = values.screenshot[0];
    const screenshotDataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    startTransition(async () => {
      const result = await scrapeEventAction(values.url, screenshotDataUri);
      if (result.success) {
        toast({
          title: 'Scraping successful',
          description: result.message,
        });
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Scraping failed',
          description: result.message,
        });
      }
    });
  };
  
  const handlePaste = (event: React.ClipboardEvent, onChange: (files: FileList | null) => void) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                onChange(dataTransfer.files);
                break;
            }
        }
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Source URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/events/the-new-play" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <FormField
          control={form.control}
          name="screenshot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Screenshot</FormLabel>
                <div 
                  className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer text-muted-foreground hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  onPaste={(e) => handlePaste(e, field.onChange)}
                  tabIndex={0} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      (e.currentTarget.querySelector('input') as HTMLInputElement)?.click();
                    }
                  }}
              >
                  <FormControl>
                        <Input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => field.onChange(e.target.files)}
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                      />
                  </FormControl>
                  <div className="flex flex-col items-center pointer-events-none">
                      <ClipboardPaste className="w-10 h-10" />
                      <p className="mt-2 text-sm">
                          <span className="font-semibold text-primary">Click to upload</span> or paste an image
                      </p>
                      <p className="text-xs">Supports PNG, JPG, GIF</p>
                  </div>
              </div>
                {fileName && (
                <div className="flex items-center gap-2 mt-2 text-sm font-medium">
                    <Paperclip className="w-4 h-4" />
                    <span>{fileName}</span>
                </div>
                )}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Scrape Event
        </Button>
      </form>
    </Form>
  );
}
