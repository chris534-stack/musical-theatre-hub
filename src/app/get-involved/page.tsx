
import React from 'react';

import { ReviewerRequestForm } from '@/components/get-involved/ReviewerRequestForm';
import { LatestReviews } from '@/components/get-involved/LatestReviews';
import { SuggestIdeaSection } from '@/components/get-involved/SuggestIdeaSection';


export default function GetInvolvedPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Get Involved</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <section className="p-6 border rounded-lg shadow-sm flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Become a Community Reviewer</h2>
          <p className="text-muted-foreground mb-4 flex-grow">
            Represent the voice of our community! As a reviewer, you'll provide valuable feedback that supports local artists and enriches the Eugene theatre scene. If you're passionate and have a constructive spirit, we'd love to hear from you.
          </p>
          <ReviewerRequestForm />
        </section>

        <section className="p-6 border rounded-lg shadow-sm flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Show Reviews</h2>
          <LatestReviews />
        </section>

        <SuggestIdeaSection />

        <section className="p-6 border rounded-lg shadow-sm flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Audition Opportunities</h2>
          <p>Upcoming audition information will go here.</p>
        </section>

        <section className="p-6 border rounded-lg shadow-sm flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Volunteer Positions</h2>
          <p>Available volunteer roles will be listed here.</p>
        </section>

        <section className="p-6 border rounded-lg shadow-sm flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Green Room Guild</h2>
          <p>Information and a link to the Green Room Guild will be here.</p>
        </section>
      </div>
    </div>
  );
}
