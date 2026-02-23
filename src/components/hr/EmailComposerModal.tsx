import React, { useState } from 'react';
import { X, Send, FileText } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

interface EmailComposerModalProps {
    recipientName: string;
    recipientEmail: string;
    candidateId: string;
    onClose: () => void;
}

const TEMPLATES = {
    interview_invite: {
        subject: 'Interview Invitation',
        body: `Dear [NAME],

We are pleased to invite you for an interview for the position you applied for.

We look forward to speaking with you.

Best regards,
[YOUR_NAME]`
    },
    status_update: {
        subject: 'Application Status Update',
        body: `Dear [NAME],

We wanted to update you on your application status.

Thank you for your patience.

Best regards,
[YOUR_NAME]`
    },
    rejection: {
        subject: 'Application Update',
        body: `Dear [NAME],

Thank you for taking the time to apply and interview with us. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We appreciate your interest in our company and wish you the best in your job search.

Best regards,
[YOUR_NAME]`
    }
};

const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
    recipientName,
    recipientEmail,
    candidateId,
    onClose
}) => {
    const { currentUser } = useAuth();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');

    const applyTemplate = (templateKey: string) => {
        const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
        setSubject(template.subject);
        setBody(
            template.body
                .replace('[NAME]', recipientName)
                .replace('[YOUR_NAME]', currentUser?.displayName || 'HR Team')
        );
        setSelectedTemplate(templateKey);
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            alert('Please fill in subject and message');
            return;
        }

        // Open HR's email client with pre-filled template
        const mailtoLink = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        // Log activity
        try {
            await addDoc(collection(db, `applications/${candidateId}/activity`), {
                type: 'email_drafted',
                subject,
                draftedBy: currentUser?.uid,
                draftedByName: currentUser?.displayName || 'Unknown',
                draftedAt: new Date(),
                to: recipientEmail,
                template: selectedTemplate || 'custom'
            });
        } catch (error) {
            console.error('Failed to log email activity:', error);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Email</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            To: {recipientName} ({recipientEmail})
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Templates */}
                <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Quick Templates
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => applyTemplate('interview_invite')}
                            className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            Interview Invite
                        </button>
                        <button
                            onClick={() => applyTemplate('status_update')}
                            className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                            Status Update
                        </button>
                        <button
                            onClick={() => applyTemplate('rejection')}
                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Rejection
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Email subject"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Message
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={12}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Type your message here..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!subject.trim() || !body.trim()}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <Send size={18} />
                        Open in Email Client
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailComposerModal;
