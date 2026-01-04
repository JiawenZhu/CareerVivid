
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { sendMessage } from '../services/messageService';
import confetti from 'canvas-confetti';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownerId: string;
    ownerName?: string;
    portfolioId: string;
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, ownerId, ownerName, portfolioId }) => {
    const [message, setMessage] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !ownerId) return;

        setIsSubmitting(true);
        try {
            await sendMessage(ownerId, portfolioId, message, senderName, senderEmail, subject);

            setIsSuccess(true);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 10002 // Higher than modal
            });

            // Reset after delay and close
            setTimeout(() => {
                onClose();
                // Reset state after close animation finishes
                setTimeout(() => {
                    setIsSuccess(false);
                    setMessage('');
                    setSenderName('');
                    setSenderEmail('');
                    setSubject('');
                }, 300);
            }, 2000);

        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl relative z-[10000] overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                {isSuccess ? 'Message Sent!' : 'Send us a message'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isSuccess ? 'Thanks for reaching out.' : `To ${ownerName || 'Portfolio Owner'}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                            <Send size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">Sent Successfully!</h4>
                        <p className="text-gray-500 dark:text-gray-400">
                            Your message has been delivered to {ownerName || 'the owner'}.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Your Email
                                </label>
                                <input
                                    type="email"
                                    value={senderEmail}
                                    onChange={(e) => setSenderEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="How can we help?"
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us more about your question or issue..."
                                required
                                rows={4}
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || !message.trim()}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Message
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
};

export default MessageModal;
