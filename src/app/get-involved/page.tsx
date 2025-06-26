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
export default function GetInvolvedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="container mx-auto py-8 px-4"> {/* Keeping container and padding for overall page */}
      <h1 className="text-3xl font-bold mb-8">Get Involved</h1>

      {/* Bento box layout container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Adjust grid columns as needed for desired layout */}
        {/* Audition Opportunities section */}
        <section className="p-6 border rounded-lg shadow-sm flex flex-col"> {/* Added padding, border, rounded corners, and shadow for a card-like appearance */}
          <h2 className="text-2xl font-semibold mb-4">Audition Opportunities</h2>
          {/* Placeholder for Audition Opportunities content */}
          <p>Upcoming audition information will go here.</p>
        </section>

        {/* Volunteer Positions section */}
        <section className="p-6 border rounded-lg shadow-sm flex flex-col"> {/* Added styling */}
          <h2 className="text-2xl font-semibold mb-4">Volunteer Positions</h2>
          {/* Placeholder for Volunteer Positions content */}
          <p>Available volunteer roles will be listed here.</p>
        </section>

        {/* Suggest an Idea section (with modal trigger) */}
        {/* You can add grid-row-span or grid-col-span classes here to make this section larger */}
        <section className="p-6 border rounded-lg shadow-sm flex flex-col justify-center items-center"> {/* Added styling and centered content */}
          <h2 className="text-2xl font-semibold mb-4">Suggest an Idea</h2>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>Suggest an Idea</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]"> {/* Adjust modal width */}
              <DialogHeader>
                <DialogTitle>Suggest a Show or Project Idea</DialogTitle>
              </DialogHeader>
              <SuggestIdeaForm closeModal={() => setIsModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </section>

        {/* Show Reviews section */}
        {/* You might want to make this section span multiple columns */}
        <section className="p-6 border rounded-lg shadow-sm flex flex-col"> {/* Added styling */}
          <h2 className="text-2xl font-semibold mb-4">Show Reviews</h2>
          {/* Placeholder for Show Reviews content */}
          <p>Reviews for current shows will appear here.</p>
        </section>

        {/* Green Room Guild section */}
        <section className="p-6 border rounded-lg shadow-sm flex flex-col"> {/* Added styling */}
          <h2 className="text-2xl font-semibold mb-4">Green Room Guild</h2>
          {/* Placeholder for Green Room Guild content */}
          <p>Information and a link to the Green Room Guild will be here.</p>
        </section>
      </div> {/* End of bento box layout container */}
    </div>
  );
}