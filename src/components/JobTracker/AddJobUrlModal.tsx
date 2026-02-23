import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Wand2, FileText } from 'lucide-react';
import { JobApplicationData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { parseJobDescriptionFromText } from '../../services/geminiService';

interface AddJobModalProps {
    onClose: () => void;
    onJobAdded: (jobData: Omit<JobApplicationData, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ onClose, onJobAdded }) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !currentUser) {
            setError(t('job_tracker.modal.error_empty'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const parsedData = await parseJobDescriptionFromText(currentUser.uid, description);

            onJobAdded({
                jobTitle: parsedData.jobTitle || 'Untitled Job',
                companyName: parsedData.companyName || 'Unknown Company',
                location: parsedData.location || '',
                jobPostURL: '', // No URL in this flow
                applicationStatus: 'To Apply',
                jobDescription: description,
            });

        } catch (err: any) {
            console.error("Error parsing description:", err);
            setError(err.message || t('job_tracker.modal.error_parsing'));
            // Fallback on error: create a manual entry with the pasted text
            onJobAdded({
                jobTitle: 'Untitled Job (Manual)',
                companyName: 'Unknown Company',
                jobPostURL: '',
                applicationStatus: 'To Apply',
                jobDescription: description,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{t('job_tracker.modal.track_new_title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {t('job_tracker.modal.paste_desc')}
                    </p>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('job_tracker.modal.paste_placeholder')}
                            required
                            rows={12}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-300"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                            {isLoading ? t('job_tracker.modal.analyzing') : t('job_tracker.modal.analyze_btn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddJobModal;