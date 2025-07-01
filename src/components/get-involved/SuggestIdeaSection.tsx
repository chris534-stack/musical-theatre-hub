
'use client';

import React, { useState } from 'react';
import SuggestIdeaForm from '@/components/SuggestIdeaForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function SuggestIdeaSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <section className="p-6 border rounded-lg shadow-sm flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold mb-4">Suggest an Idea</h2>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button>Suggest a Show or Project</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Suggest a Show or Project Idea</DialogTitle>
          </DialogHeader>
          <SuggestIdeaForm closeModal={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
