
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addListingRequestAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

const listingRequestSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required.'),
  contactName: z.string().min(2, 'Your name is required.'),
  contactEmail: z.string().email('Please enter a valid email address.'),
  websiteUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal("")),
  message: z.string().optional(),
});

type ListingRequestValues = z.infer<typeof listingRequestSchema>;

export function ListingRequestForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ListingRequestValues>({
    resolver: zodResolver(listingRequestSchema),
    defaultValues: {
      organizationName: '',
      contactName: '',
      contactEmail: '',
      websiteUrl: '',
      message: '',
    },
  });

  const onSubmit = (data: ListingRequestValues) => {
    startTransition(async () => {
      const result = await addListingRequestAction(data);

      if (result.success) {
        toast({
          title: 'Request Submitted!',
          description: "Thank you! We've received your request and will be in touch soon.",
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: result.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theatre/Organization Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid sm:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Your Email</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website or Social Media URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a little bit about your organization..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </div>
      </form>
    </Form>
  );
}
