'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import type { UserProfile } from '@/lib/types';
import { updateUserProfileAction } from '@/lib/actions';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, XCircle } from 'lucide-react';

const profileFormSchema = z.object({
    displayName: z.string().min(2, "Display name is required."),
    bio: z.string().optional(),
    roleInCommunity: z.enum(['Performer', 'Technician', 'Designer', 'Director', 'Audience', 'Other']),
    communityStartDate: z.string().regex(/^\d{4}$/, { message: "Please enter a valid 4-digit year." }).optional().or(z.literal("")),
    galleryImageUrls: z.array(z.object({ value: z.string().url("Must be a valid URL or empty.") })).optional(),
    coverPhotoUrl: z.string().url("Must be a valid URL or empty.").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onProfileUpdate: (updatedProfile: UserProfile) => void;
}

export function EditProfileSheet({ isOpen, onClose, profile, onProfileUpdate }: EditProfileSheetProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            roleInCommunity: profile.roleInCommunity || 'Audience',
            communityStartDate: profile.communityStartDate || '',
            galleryImageUrls: profile.galleryImageUrls?.map(url => ({ value: url })) || [],
            coverPhotoUrl: profile.coverPhotoUrl || '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "galleryImageUrls",
    });

    const onSubmit = (data: ProfileFormValues) => {
        const updateData: Partial<UserProfile> = {
            ...data,
            galleryImageUrls: data.galleryImageUrls?.map(item => item.value).filter(Boolean),
        };

        startTransition(async () => {
            const result = await updateUserProfileAction(profile.userId, updateData);

            if (result.success) {
                toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
                onProfileUpdate({ ...profile, ...updateData });
                onClose();
            } else {
                toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
            }
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Edit Your Profile</SheetTitle>
                    <SheetDescription>Make your profile your own. Share your story with the community.</SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6 h-full flex flex-col">
                        <div className="space-y-4 overflow-y-auto pr-6 flex-grow">
                            <FormField control={form.control} name="displayName" render={({ field }) => (
                                <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bio" render={({ field }) => (
                                <FormItem><FormLabel>About Me / Bio</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="roleInCommunity" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>My Role in the Community</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select your primary role" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {['Performer', 'Technician', 'Designer', 'Director', 'Audience', 'Other'].map(role => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField control={form.control} name="communityStartDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Community Start Year</FormLabel>
                                        <FormControl><Input placeholder="e.g., 2019" {...field} /></FormControl>
                                        <FormDescription className="text-xs">The year you joined the community.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                             <FormField control={form.control} name="coverPhotoUrl" render={({ field }) => (
                                <FormItem><FormLabel>Cover Photo URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/cover.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                            <div>
                                <FormLabel>Photo Gallery URLs</FormLabel>
                                <div className="space-y-2 pt-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <FormField control={form.control} name={`galleryImageUrls.${index}.value`} render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><XCircle className="h-5 w-5 text-destructive" /></Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Photo URL</Button>
                            </div>
                        </div>
                        <SheetFooter>
                             <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
