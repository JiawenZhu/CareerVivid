import React, { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle, X } from 'lucide-react';
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
      // Reset state when modal opens
      setRating(0);
      setComment('');
      setIsLoading(false);
      setIsSuccess(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onClose]);

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
      await addDoc(collection(db, "feedback"), {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'N/A',
        rating,
        comment,
        createdAt: serverTimestamp(),
        status: 'New', // Default status for new feedback
        source,
        context,
      });

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

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <button onClick={handleCancel} className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
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
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">How was your experience?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your feedback is valuable to us.</p>

            <div className="flex justify-center items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                  <Star
                    size={36}
                    className={`transition-colors ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience (optional)..."
              rows={4}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleCancel} disabled={isLoading} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-sm">
                Cancel
              </button>
              <button
                onClick={handleSendFeedback}
                disabled={isLoading}
                className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors flex items-center gap-2 disabled:opacity-50"
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