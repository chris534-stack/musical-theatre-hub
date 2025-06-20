import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabaseClient';

/* --------------------------------------------------------------------------
 * Schema & Types
 * --------------------------------------------------------------------------*/
const FormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional().nullable(),
  pronouns: z.string().optional().nullable()
});

type FormValues = z.infer<typeof FormSchema>;

/* --------------------------------------------------------------------------
 * Component
 * --------------------------------------------------------------------------*/
export default function ReviewerApplicationForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    setSubmitSuccess(false);

    // Ensure user is authenticated and get token
    const {
      data: { session },
      error: authError
    } = await supabase.auth.getSession();

    if (authError || !session) {
      setSubmitError('You must be signed in to apply.');
      return;
    }

    const token = session.access_token;
    try {
      const response = await fetch('/api/reviewer-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Application failed');
      }

      setSubmitSuccess(true);
      onSubmitted?.();
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
    }
  };

  if (submitSuccess) {
    return (
      <div className="mt-4 p-4 bg-green-100 rounded-md text-green-800 text-center">
        <p>Application submitted successfully! We’ll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block font-medium">First Name *</label>
        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          {...register('firstName')}
        />
        {errors.firstName && <p className="text-red-600 text-sm">{errors.firstName.message}</p>}
      </div>

      <div>
        <label className="block font-medium">Last Name *</label>
        <input type="text" className="w-full border rounded px-2 py-1" {...register('lastName')} />
        {errors.lastName && <p className="text-red-600 text-sm">{errors.lastName.message}</p>}
      </div>

      <div>
        <label className="block font-medium">Preferred Name</label>
        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          {...register('preferredName')}
        />
      </div>

      <div>
        <label className="block font-medium">Pronouns</label>
        <input type="text" className="w-full border rounded px-2 py-1" {...register('pronouns')} />
      </div>

      {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
