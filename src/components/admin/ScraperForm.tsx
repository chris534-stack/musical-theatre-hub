
'use client';

import { useTransition, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { scrapeEventAction } from '@/lib/actions';
import { Loader2, Paperclip, ClipboardPaste } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Venue } from '@/lib/types';
import type { ScrapeEventDetailsOutput } from '@/ai/flows/scrape-event-details';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EventEditorForm } from '@/components/admin/EventEditorForm';


const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  screenshot: z.any()
    .refine((files) => files?.length == 1, "A screenshot image is required.")
    .refine((files) => files?.[0]?.type.startsWith("image/"), "Only image files are accepted."),
});

export function ScraperForm({ venues, onSuccess }: { venues: Venue[], onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [prefillData, setPrefillData] = useState<(ScrapeEventDetailsOutput & { sourceUrl?: string }) | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const result = await scrapeEventAction(values.url || undefined, screenshotDataUri);
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
                toast({
                    title: "Image Pasted!",
                    description: "The screenshot has been added from your clipboard.",
                });
                break;
            }
        }
    }
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
                <FormLabel>Event Source URL (Optional)</FormLabel>
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
                      className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50"
                      onPaste={(e) => handlePaste(e, field.onChange)}
                      tabIndex={0}
                    >
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*"
                            className="sr-only"
                            ref={(e) => {
                                field.ref(e);
                                if(fileInputRef) fileInputRef.current = e;
                            }}
                            onChange={(e) => field.onChange(e.target.files)}
                          />
                        </FormControl>
                        <div className="flex flex-col items-center text-center pointer-events-none">
                            <ClipboardPaste className="w-10 h-10 mb-2" />
                            <p className="font-semibold text-foreground">
                                Paste an image from your clipboard
                            </p>
                            <p className="text-sm">Press Ctrl+V or ⌘+V in this box</p>
                            
                            <div className="my-4 flex items-center w-full max-w-xs">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="flex-shrink mx-4 text-xs uppercase">Or</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>
                            
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="pointer-events-auto"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Upload a File
                            </Button>
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
            <Button type="submit" disabled={isPending || !screenshotFile}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Scrape and Prefill Form
            </Button>
        </form>
        </Form>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Review and Add Event</DialogTitle>
                    <DialogDescription>
                        The AI has pre-filled the form with details from the screenshot. Please review, correct, and complete the information before adding the event.
                    </DialogDescription>
                </DialogHeader>
                {prefillData && (
                    <EventEditorForm 
                        initialData={prefillData} 
                        venues={venues} 
                        onSuccess={() => {
                            setIsEditorOpen(false);
                            form.reset();
                            if (onSuccess) onSuccess();
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    </>
  );
}
