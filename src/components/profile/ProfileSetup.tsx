
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { updateUserProfileAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const setupSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters long.'),
});

type SetupFormValues = z.infer<typeof setupSchema>;

interface ProfileSetupProps {
  onProfileCreate: () => void;
}

export function ProfileSetup({ onProfileCreate }: ProfileSetupProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  const onSubmit = (data: SetupFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a profile.',
      });
      return;
    }

    startTransition(async () => {
      const result = await updateUserProfileAction(user.uid, {
        displayName: data.displayName,
        email: user.email,
        photoURL: user.photoURL,
        bio: 'Welcome to the Our Stage community! Feel free to edit your profile and share a bit about yourself.',
        roleInCommunity: 'Audience',
      });

      if (result.success) {
        toast({
          title: 'Profile Created!',
          description: 'Welcome to the community!',
        });
        onProfileCreate();
      } else {
        toast({
          variant: 'destructive',
          title: 'Setup Failed',
          description: result.message,
        });
      }
    });
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-secondary">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Welcome to Our Stage!</CardTitle>
          <CardDescription>Let's set up your public profile. You can change this and add more details later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose a Display Name</FormLabel>
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
                  Create Profile
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
