import React from 'react';

interface ReviewerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSubmitted?: () => void;
}

declare const ReviewerApplicationModal: React.FC<ReviewerApplicationModalProps>;
export default ReviewerApplicationModal;
