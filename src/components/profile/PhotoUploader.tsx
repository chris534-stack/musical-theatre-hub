

'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateUploadUrlAction, savePhotoUrlAction } from '@/lib/actions';
import { Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  userId: string;
  onUploadComplete: () => void;
  isGridItem?: boolean;
  limit: number;
  currentCount: number;
}

const formSchema = z.object({
  photo: z.any()
    .refine((files) => files?.length === 1, "An image is required.")
    .refine((files) => files?.[0]?.type.startsWith("image/"), "Only image files are accepted.")
    .refine((files) => files?.[0]?.size <= 10 * 1024 * 1024, "File size must be 10MB or less."),
});

export function PhotoUploader({ userId, onUploadComplete, isGridItem = false, limit, currentCount }: PhotoUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRemaining = limit - currentCount;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationResult = formSchema.safeParse({ photo: [file] });

    if (!validationResult.success) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: validationResult.error.errors[0].message,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsLoading(true);
    try {
      const signedUrlResult = await generateUploadUrlAction(userId, file.name, file.type);
      if (!signedUrlResult.success || !signedUrlResult.data) {
        throw new Error(signedUrlResult.message || 'Could not get an upload URL.');
      }

      const { uploadUrl, filePath } = signedUrlResult.data;

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed.');
      }

      const saveResult = await savePhotoUrlAction(userId, filePath);
      if (!saveResult.success) {
        throw new Error(saveResult.message || 'Failed to save photo to profile.');
      }

      toast({
        title: 'Upload successful!',
        description: 'Your photo has been added to the gallery.',
      });
      onUploadComplete();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: errorMessage,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsLoading(false);
    }
  };
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg",
        isGridItem && "aspect-square p-2 sm:p-4 h-full"
      )}
    >
        {isLoading ? (
            <div className="flex flex-col items-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mb-2" />
                <p className="font-medium text-xs sm:text-sm">Uploading...</p>
            </div>
        ) : (
            <>
                <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
                 <UploadCloud className="h-6 w-6 sm:h-8 sm:w-8 mb-1" />
                 <p className="font-medium text-foreground text-xs sm:text-sm">Add to Gallery</p>
                 <p className="text-[10px] sm:text-xs leading-tight mt-1 mb-2">You can add {photosRemaining} more photo{photosRemaining !== 1 ? 's' : ''}.</p>
                 <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || photosRemaining <= 0}
                 >
                    Upload Photo
                 </Button>
            </>
        )}
    </div>
  );
}
