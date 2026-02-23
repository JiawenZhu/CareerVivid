import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface CancellationFeedbackModalProps {
    isOpen: boolean;
    onConfirm: (data: { reason: string; feedback: string }) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const REASONS = [
    "Too expensive",
    "Found a job",
    "Missing features",
    "Technical issues",
    "Not using it enough",
    "Other"
];

const CancellationFeedbackModal: React.FC<CancellationFeedbackModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedReason) return;
        onConfirm({ reason: selectedReason, feedback });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-w-[320px]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                            <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">We're sorry to see you go</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Please tell us why you're leaving</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {REASONS.map((reason) => (
                            <button
                                key={reason}
                                onClick={() => setSelectedReason(reason)}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedReason === reason
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {reason}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Anything else you'd like to share? (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            rows={3}
                            placeholder="Your feedback helps us improve..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedReason || isLoading}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Processing...' : (
                                <>
                                    Confirm Cancel
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CancellationFeedbackModal;
