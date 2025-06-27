'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
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

export function AddEventButton() {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6"
          size="icon"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Event</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Event via Scraper</DialogTitle>
          <DialogDescription>
            Provide a URL and screenshot to have the AI automatically extract event details. The new event will be added to the pending review list.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <ScraperForm onSuccess={() => setIsOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
