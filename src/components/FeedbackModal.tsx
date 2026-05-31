import React, { useState, useEffect, useCallback } from 'react';
import { Star, Loader2, CheckCircle, X, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  onCancel?: () => void;
  source: 'resume_export' | 'interview' | 'editor';
  context?: Record<string, any>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmitted, onCancel, source, context }) => {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setIsLoading(false);
      setIsSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    if (onCancel) onCancel();
    onClose();
  }, [onCancel, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  const handleSendFeedback = async () => {
    if (rating === 0) {
      setError('Please select a rating before sending.');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to send feedback.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const feedbackPayload: Record<string, any> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'N/A',
        rating,
        comment,
        createdAt: serverTimestamp(),
        status: 'New',
        source,
      };

      if (context !== undefined) {
        feedbackPayload.context = context;
      }

      await addDoc(collection(db, "feedback"), feedbackPayload);

      setIsSuccess(true);
      if (onSubmitted) onSubmitted();
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err) {
      console.error("Error saving feedback:", err);
      setError('Sorry, something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyBySource = {
    resume_export: {
      label: 'Resume export',
      title: 'Rate your export',
      description: 'Tell us how the export experience worked for you.',
      placeholder: 'What should we improve about exporting resumes? (optional)',
    },
    interview: {
      label: 'Interview report',
      title: 'Rate this report',
      description: 'Was this coaching report useful for your interview practice?',
      placeholder: 'Share what was helpful or what was missing. (optional)',
    },
    editor: {
      label: 'Editor',
      title: 'Rate your editor experience',
      description: 'Your feedback helps us improve the workspace.',
      placeholder: 'Tell us more about your experience. (optional)',
    },
  }[source];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={handleCancel}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Close feedback modal"
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thank you!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start gap-3 pr-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">{copyBySource.label}</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{copyBySource.title}</h3>
                <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">{copyBySource.description}</p>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/70">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="rounded-md p-1 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label={`Rate ${star} out of 5`}
                >
                  <Star
                    size={34}
                    className={`transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={copyBySource.placeholder}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleCancel} disabled={isLoading} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSendFeedback}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
