
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addEventFromFormAction, updateEventAction } from '@/lib/actions';
import type { ScrapeEventDetailsOutput } from '@/ai/flows/scrape-event-details';
import type { Venue, Event } from '@/lib/types';
import { Loader2, PlusCircle, XCircle } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';

const eventFormSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  description: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  venueId: z.string().min(1, 'Venue is required.'),
  type: z.string().min(1, 'Type is required.'),
  occurrences: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
    time: z.string().regex(/^$|^\d{2}:\d{2}$/, 'Time must be in HH:mm format or empty.'),
  })).min(1, 'At least one occurrence is required.'),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventEditorFormProps {
    initialData?: ScrapeEventDetailsOutput & { sourceUrl?: string };
    eventToEdit?: Event;
    venues: Venue[];
    onSuccess: () => void;
}

export function EventEditorForm({ initialData, eventToEdit, venues, onSuccess }: EventEditorFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const isEditMode = !!eventToEdit;

  const getInitialValues = () => {
    if (isEditMode) {
        return {
            title: eventToEdit.title || '',
            description: eventToEdit.description || '',
            url: eventToEdit.url || '',
            venueId: eventToEdit.venueId || '',
            type: eventToEdit.type || 'Special Event',
            occurrences: eventToEdit.occurrences?.length ? eventToEdit.occurrences : [{ date: '', time: '' }],
        };
    }
    if (initialData) {
        const foundVenue = venues.find(v => v.name === initialData.venue);
        const mappedOccurrences = initialData.occurrences?.length 
            ? initialData.occurrences.map(o => ({ date: o.date, time: o.time || '' }))
            : [{ date: '', time: '' }];

        return {
            title: toTitleCase(initialData.title) || '',
            description: initialData.description || '',
            url: initialData.sourceUrl || '',
            venueId: foundVenue?.id || '',
            type: 'Special Event',
            occurrences: mappedOccurrences,
        };
    }
    return {
        title: '', description: '', url: '', venueId: '', type: 'Special Event', occurrences: [{ date: '', time: '' }],
    };
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getInitialValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "occurrences",
  });

  const onSubmit = (data: EventFormValues) => {
    startTransition(async () => {
      const result = isEditMode
        ? await updateEventAction(eventToEdit.id, data)
        : await addEventFromFormAction(data);

      if (result.success) {
        toast({
          title: isEditMode ? 'Event Updated' : 'Event Added',
          description: result.message,
        });
        onSuccess();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="venueId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Venue</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {venues.map(venue => (
                        <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Play">Play</SelectItem>
                        <SelectItem value="Musical">Musical</SelectItem>
                        <SelectItem value="Improv">Improv</SelectItem>
                        <SelectItem value="Special Event">Special Event</SelectItem>
                        <SelectItem value="Audition">Audition</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div>
            <FormLabel>Occurrences</FormLabel>
            <div className="space-y-2 pt-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name={`occurrences.${index}.date`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl><Input placeholder="YYYY-MM-DD" {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`occurrences.${index}.time`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl><Input placeholder="HH:mm" {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <XCircle className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <FormMessage>{form.formState.errors.occurrences?.message}</FormMessage>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ date: '', time: '' })}
                >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Occurrence
            </Button>
        </div>

         <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source URL (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Event' : 'Add Event'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
