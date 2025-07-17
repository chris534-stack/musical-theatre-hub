
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { submitReviewAction } from '@/lib/actions';
import type { Review } from '@/lib/types';
import { Loader2, MessageSquareWarning } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toTitleCase } from '@/lib/utils';

const experienceOptions = ["Exceptional & Memorable", "Thoroughly Entertaining", "Good for a Laugh", "Thought-Provoking & Important", "A Promising Production", "An Acquired Taste", "A Mixed Bag"];
const categoryOptions = [
    { id: "date-night", label: "Date Night" },
    { id: "family-friendly", label: "Family-Friendly" },
    { id: "comedic", label: "Comedic" },
    { id: "dramatic", label: "Dramatic" },
    { id: "thought-provoking", label: "Thought-Provoking" },
    { id: "musical", label: "Musical" },
];

const reviewFormSchema = z.object({
  overallExperience: z.string().min(1, 'Please select your overall experience.'),
  specialMomentsText: z.string().min(10, 'Please share at least a few words.'),
  recommendations: z.array(z.string()).optional(),
  showHeartText: z.string().min(10, 'Please share at least a few words.'),
  communityImpactText: z.string().min(10, 'Please share at least a few words.'),
  ticketInfo: z.string().min(5, 'Please provide some detail on your ticket.'),
  valueConsiderationText: z.string().min(10, 'Please share at least a few words.'),
  timeWellSpentText: z.string().min(10, 'Please share at least a few words.'),
  disclosureText: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewEditorProps {
    review: Review;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ReviewEditor({ review, isOpen, onClose, onSuccess }: ReviewEditorProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const { user } = useAuth();

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewFormSchema),
        defaultValues: {
            overallExperience: review.overallExperience || '',
            specialMomentsText: review.specialMomentsText || '',
            recommendations: review.recommendations || [],
            showHeartText: review.showHeartText || '',
            communityImpactText: review.communityImpactText || '',
            ticketInfo: review.ticketInfo || '',
            valueConsiderationText: review.valueConsiderationText || '',
            timeWellSpentText: review.timeWellSpentText || '',
            disclosureText: review.disclosureText || '',
        },
    });

    const onSubmit = (data: ReviewFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: "Not Authenticated", description: "You must be logged in to submit a review." });
            return;
        }

        startTransition(async () => {
            const result = await submitReviewAction({
                // Pass existing review data to update it
                id: review.id, 
                ...review, 
                // Overwrite with new form data
                ...data, 
                // Ensure status is reset to published
                status: 'published',
            });

            if (result.success) {
                toast({
                    title: 'Review Updated!',
                    description: 'Thank you for making the changes. Your review is now public again.',
                });
                onSuccess();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: result.message,
                });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Editing Review: {toTitleCase(review.showTitle)}</DialogTitle>
                    <DialogDescription>
                        Please address the feedback below and resubmit your review.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[75vh] overflow-y-auto pr-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                            
                             <Alert variant="destructive" className="bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-200">
                                <MessageSquareWarning className="h-4 w-4 !text-amber-600 dark:!text-amber-500" />
                                <AlertTitle className="font-semibold">Admin Feedback</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap">{review.adminNotes}</AlertDescription>
                            </Alert>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-primary">Section 1: Your Experience</h3>
                                <FormField
                                    control={form.control}
                                    name="overallExperience"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Overall Experience</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {experienceOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="specialMomentsText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>What made this performance special?</FormLabel>
                                            <FormControl><Textarea rows={4} {...field} /></FormControl>
                                            <FormDescription>Focus on the strengths. What did you enjoy most? This could be the energy of the ensemble, a standout performance, the set design, lighting, or a particular moment that moved you.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="recommendations"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>How would you categorize this show? (Optional)</FormLabel>
                                            {categoryOptions.map((item) => (
                                                <FormField
                                                    key={item.id}
                                                    control={form.control}
                                                    name="recommendations"
                                                    render={({ field }) => (
                                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item.label)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                        ? field.onChange([...(field.value || []), item.label])
                                                                        : field.onChange(field.value?.filter((value) => value !== item.label))
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-primary">Section 2: The Show's Message & Impact</h3>
                                <FormField
                                    control={form.control}
                                    name="showHeartText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Describe the Heart of the Show</FormLabel>
                                            <FormControl><Textarea rows={4} {...field} /></FormControl>
                                            <FormDescription>How would you describe the content and tone of the script / source material? Is it a lighthearted spectacle, a joyful celebration, or something more impactful and challenging?</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="communityImpactText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Is this show important for Eugene right now?</FormLabel>
                                            <FormControl><Textarea rows={4} {...field} /></FormControl>
                                            <FormDescription>Thinking about our local community, does this show feel particularly relevant or necessary? Why or why not?</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-primary">Section 3: Value & Time</h3>
                                <FormField
                                    control={form.control}
                                    name="ticketInfo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Actual Cost</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormDescription>How much did your ticket cost? What seat did you get for this price?</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="valueConsiderationText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Production Value & Admission</FormLabel>
                                            <FormControl><Textarea rows={4} {...field} /></FormControl>
                                            <FormDescription>Considering the cost of admission, please discuss the production value. Did the performance, sets, costumes, and overall experience provide a value that felt right for the ticket price?</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="timeWellSpentText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>A Rewarding Evening?</FormLabel>
                                            <FormControl><Textarea rows={4} {...field} /></FormControl>
                                            <FormDescription>Your time is valuable. Did this production feel like a rewarding way to spend an evening out? What made it feel that way?</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-primary">Section 4: Transparency</h3>
                                <FormField
                                    control={form.control}
                                    name="disclosureText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bias & Relationship Disclosure (Optional)</FormLabel>
                                            <FormControl><Textarea rows={3} {...field} placeholder="e.g., I am friends with the lead actor, my partner was the set designer..." /></FormControl>
                                            <FormDescription>It's okay to have friends in theatre—that's the point of community! To maintain integrity, we ask that you're transparent about any relationships that might affect your opinion.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Resubmit Review
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
