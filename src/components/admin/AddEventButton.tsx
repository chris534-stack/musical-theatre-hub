
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
import { ScraperForm } from '@/components/admin/ScraperForm';
import { Plus } from 'lucide-react';
import type { Venue } from '@/lib/types';
import { cn } from '@/lib/utils';

export function AddEventButton({ venues, isFloating = true }: { venues: Venue[], isFloating?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isFloating ? (
            <Button
                className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6"
                size="icon"
            >
                <Plus className="h-6 w-6" />
                <span className="sr-only">Add Event</span>
            </Button>
        ) : (
             <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Event via Scraper</DialogTitle>
          <DialogDescription>
            Provide a URL and/or screenshot to have the AI pre-fill an event form for you to review and submit.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <ScraperForm venues={venues} onSuccess={() => setIsOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
