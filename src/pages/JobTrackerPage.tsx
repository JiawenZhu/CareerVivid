import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useJobTracker } from '../hooks/useJobTracker';
import { JobApplicationData } from '../types';
import StatusOverview from '../components/JobTracker/StatusOverview';
import KanbanBoard from '../components/JobTracker/KanbanBoard';
import JobDetailModal from '../components/JobTracker/JobDetailModal';
import AddJobModal from '../components/JobTracker/AddJobUrlModal';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { navigate } from '../App';

const JobTrackerPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { jobApplications, isLoading, addJobApplication, updateJobApplication, deleteJobApplication } = useJobTracker();

    const [selectedJob, setSelectedJob] = useState<JobApplicationData | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [highlightForNewJob, setHighlightForNewJob] = useState(false);

    const handleCardClick = (job: JobApplicationData) => {
        setSelectedJob(job);
        setHighlightForNewJob(false); // Don't highlight when clicking existing cards
    };

    const handleCloseDetailModal = () => {
        setSelectedJob(null);
        setHighlightForNewJob(false);
    };

    const handleJobAdded = async (jobData: Omit<JobApplicationData, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
        setIsAddModalOpen(false);
        if (!currentUser) return;

        try {
            const newJobId = await addJobApplication(jobData);
            if (newJobId) {
                // Create a temporary object to immediately open the modal.
                // The snapshot listener will update the main list with the server-stamped data.
                const tempJobForModal: JobApplicationData = {
                    ...jobData,
                    id: newJobId,
                    userId: currentUser.uid,
                    createdAt: new Date(), // temp value
                    updatedAt: new Date(), // temp value
                };
                setSelectedJob(tempJobForModal);
                setHighlightForNewJob(true);
            }
        } catch (error) {
            console.error("Error adding job application:", error);
            // Optionally, show an alert to the user here.
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700">
                <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <a href="/" title={t('nav.dashboard')} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ArrowLeft size={24} />
                            </a>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('job_tracker.title')}</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('job_tracker.subtitle')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition-colors"
                        >
                            <PlusCircle size={20} />
                            {t('job_tracker.track_new')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="py-10">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    {isLoading ? (
                        <p className="text-center text-gray-500 dark:text-gray-400">{t('job_tracker.loading')}</p>
                    ) : (
                        <>
                            <StatusOverview applications={jobApplications} />
                            <div className="mt-8">
                                <KanbanBoard
                                    applications={jobApplications}
                                    onCardClick={handleCardClick}
                                    onUpdateApplication={updateJobApplication}
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>

            {isAddModalOpen && (
                <AddJobModal
                    onClose={() => setIsAddModalOpen(false)}
                    onJobAdded={handleJobAdded}
                />
            )}

            {selectedJob && (
                <JobDetailModal
                    job={jobApplications.find(j => j.id === selectedJob.id) || selectedJob}
                    onClose={handleCloseDetailModal}
                    onUpdate={updateJobApplication}
                    onDelete={deleteJobApplication}
                    highlightGenerateButton={highlightForNewJob}
                />
            )}
        </div>
    );
};

export default JobTrackerPage;