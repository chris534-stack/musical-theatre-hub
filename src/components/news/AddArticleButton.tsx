
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { AddArticleForm } from '@/components/news/AddArticleForm';
import { Plus } from 'lucide-react';

export function AddArticleButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6"
          size="icon"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add News Article</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add News Article</DialogTitle>
          <DialogDescription>
            Provide a URL to a news article or review. The AI will summarize it and find a relevant image.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <AddArticleForm onSuccess={() => setIsOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
