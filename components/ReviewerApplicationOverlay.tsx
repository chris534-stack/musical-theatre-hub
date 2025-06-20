import React from 'react';
import ReviewerApplicationForm from './ReviewerApplicationForm';

interface Props {
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ReviewerApplicationOverlay({ onClose, onSubmitted }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4">Reviewer Application</h2>
        <ReviewerApplicationForm onSubmitted={() => {
          onSubmitted?.();
          onClose();
        }} />
      </div>
    </div>
  );
}
