

'use client';

import { useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadProfilePhotoAction } from '@/lib/actions';
import { Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  userId: string;
  onUploadComplete: () => void;
  isGridItem?: boolean; // To style it as a grid item or as the main content
  limit: number;
  currentCount: number;
}

const formSchema = z.object({
  photo: z.any()
    .refine((files) => files?.length === 1, "An image is required.")
    .refine((files) => files?.[0]?.type.startsWith("image/"), "Only image files are accepted."),
});

export function PhotoUploader({ userId, onUploadComplete, isGridItem = false, limit, currentCount }: PhotoUploaderProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRemaining = limit - currentCount;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('userId', userId);

        startTransition(async () => {
            const result = await uploadProfilePhotoAction(formData);
            if (result.success) {
                toast({
                    title: 'Upload successful!',
                    description: 'Your photo has been added to the gallery.',
                });
                onUploadComplete();
                form.reset(); // Reset form after successful upload
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Upload failed',
                    description: result.message,
                });
            }
        });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg",
        isGridItem && "aspect-square p-2 sm:p-4 h-full"
      )}
    >
        {isPending ? (
            <div className="flex flex-col items-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mb-2" />
                <p className="font-medium text-xs sm:text-sm">Uploading...</p>
            </div>
        ) : (
            <>
                <Form {...form}>
                    <form className="flex flex-col items-center justify-center h-full">
                        <FormField
                            control={form.control}
                            name="photo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <UploadCloud className="h-6 w-6 sm:h-8 sm:w-8 mb-1" />
                         <p className="font-medium text-foreground text-xs sm:text-sm">Add to Gallery</p>
                         <p className="text-[10px] sm:text-xs leading-tight mt-1 mb-2">You can add {photosRemaining} more photo{photosRemaining !== 1 ? 's' : ''}.</p>
                         <Button
                            type="button"
                            size="sm"
                            className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPending}
                         >
                            Upload Photo
                         </Button>
                    </form>
                </Form>
            </>
        )}
    </div>
  );
}
