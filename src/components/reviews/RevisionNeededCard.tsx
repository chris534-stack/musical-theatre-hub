
'use client';

import { useState } from 'react';
import type { Review } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareWarning, Edit } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';
import { ReviewEditor } from './ReviewEditor';

interface RevisionNeededCardProps {
  review: Review;
  onUpdate: () => void;
}

export function RevisionNeededCard({ review, onUpdate }: RevisionNeededCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const formattedDate = review.revisionRequestedAt
    ? new Date(review.revisionRequestedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'a few moments ago';
  
  const handleSuccess = () => {
    setIsEditorOpen(false);
    onUpdate();
  };

  return (
    <>
      <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquareWarning className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-300">Revision Needed for: {toTitleCase(review.showTitle)}</CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-400 text-xs">
                Admin requested changes on {formattedDate}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-md bg-background/50 border">
            <h4 className="font-semibold text-sm">Admin Feedback:</h4>
            <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">{review.adminNotes}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => setIsEditorOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit & Resubmit Review
          </Button>
        </CardFooter>
      </Card>
      <ReviewEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        review={review}
        onSuccess={handleSuccess}
      />
    </>
  );
}
