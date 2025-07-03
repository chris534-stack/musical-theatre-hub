'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import type { UserProfile } from '@/lib/types';
import { updateUserProfileAction, uploadCoverPhotoAction } from '@/lib/actions';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

const profileFormSchema = z.object({
    displayName: z.string().min(2, "Display name is required."),
    bio: z.string().optional(),
    roleInCommunity: z.enum(['Performer', 'Technician', 'Designer', 'Director', 'Audience', 'Other']),
    communityStartDate: z.string().regex(/^\d{4}$/, { message: "Please enter a valid 4-digit year." }).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onProfileUpdate: () => void;
}

export function EditProfileSheet({ isOpen, onClose, profile, onProfileUpdate }: EditProfileSheetProps) {
    const [isTextUpdatePending, startTextUpdateTransition] = useTransition();
    const [isPhotoUpdatePending, startPhotoUpdateTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            roleInCommunity: profile.roleInCommunity || 'Audience',
            communityStartDate: profile.communityStartDate || '',
        },
    });

    const handleCoverPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('userId', profile.userId);

        startPhotoUpdateTransition(async () => {
            const result = await uploadCoverPhotoAction(formData);
            if (result.success) {
                toast({
                    title: 'Cover Photo Updated!',
                    description: 'Your new cover photo has been saved.',
                });
                onProfileUpdate();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: result.message,
                });
            }
        });
    };

    const onSubmit = (data: ProfileFormValues) => {
        const updateData: Partial<UserProfile> = { ...data };

        startTextUpdateTransition(async () => {
            const result = await updateUserProfileAction(profile.userId, updateData);

            if (result.success) {
                toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
                onProfileUpdate();
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
                            <div className="space-y-2">
                                <FormLabel>Cover Photo</FormLabel>
                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById('cover-photo-input')?.click()}
                                        disabled={isPhotoUpdatePending}
                                    >
                                        {isPhotoUpdatePending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="mr-2 h-4 w-4" />
                                        )}
                                        Upload New Photo
                                    </Button>
                                    <Input
                                        id="cover-photo-input"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={handleCoverPhotoChange}
                                        disabled={isPhotoUpdatePending}
                                    />
                                </div>
                                <FormDescription>Upload a new cover photo for your profile.</FormDescription>
                            </div>
                        </div>
                        <SheetFooter>
                             <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isTextUpdatePending || isPhotoUpdatePending}>
                                {isTextUpdatePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
