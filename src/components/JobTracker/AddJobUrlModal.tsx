import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ApplicationStatus,
    JobApplicationData,
    JobPriority,
    NO_NEXT_ACTION,
    ResumeMatchAnalysis,
    WorkModel,
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { parseJobDescriptionFromText } from '../../services/geminiService';
import AddJobEditForm from './AddJobEditForm';
import AddJobPastePanel from './AddJobPastePanel';

interface AddJobModalProps {
    onClose: () => void;
    onJobAdded: (jobData: Omit<JobApplicationData, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
    initialJobDescription?: string;
    initialJobPostUrl?: string;
    initialJobData?: InitialJobData;
    autoSubmit?: boolean;
}

export interface InitialJobData {
    jobTitle?: string;
    companyName?: string;
    location?: string;
    salaryRange?: string;
    jobPostURL?: string;
    applicationURL?: string;
    jobDescription?: string;
    stage?: string;
    resumeId?: string;
    resumeTitle?: string;
    matchAnalyses?: Record<string, ResumeMatchAnalysis>;
}

const mapStageToStatus = (stage?: string): ApplicationStatus => {
    switch ((stage || '').toLowerCase()) {
        case 'applied':
            return 'Applied';
        case 'interviewing':
            return 'Interviewing';
        case 'offer':
            return 'Offered';
        case 'rejected':
            return 'Rejected';
        default:
            return 'To Apply';
    }
};

const getDefaultNextAction = (status: ApplicationStatus): string => {
    switch (status) {
        case 'Applied':
            return 'Follow up';
        case 'Interviewing':
            return 'Prepare interview';
        case 'Offered':
            return 'Review offer';
        case 'Rejected':
            return NO_NEXT_ACTION;
        default:
            return 'Review job fit';
    }
};

const hasStructuredJobData = (job?: InitialJobData): boolean => {
    if (!job) return false;
    return Boolean(
        job.jobTitle?.trim() ||
        job.companyName?.trim() ||
        job.location?.trim() ||
        job.salaryRange?.trim()
    );
};

const AddJobModal: React.FC<AddJobModalProps> = ({
    onClose,
    onJobAdded,
    initialJobDescription = '',
    initialJobPostUrl = '',
    initialJobData,
    autoSubmit = false,
}) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();

    const [description, setDescription] = useState(initialJobDescription);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
    const [hasHydratedStructuredJob, setHasHydratedStructuredJob] = useState(false);
    const [mode, setMode] = useState<'paste' | 'edit'>('paste');

    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');
    const [salaryRange, setSalaryRange] = useState('');
    const [status, setStatus] = useState<ApplicationStatus>('To Apply');
    const [workModel, setWorkModel] = useState<WorkModel>('On-site');
    const [interviewStage, setInterviewStage] = useState('');
    const [dateApplied, setDateApplied] = useState('');
    const [priority, setPriority] = useState<JobPriority>('Medium');
    const [nextAction, setNextAction] = useState('');
    const [nextActionDueDate, setNextActionDueDate] = useState('');
    const [contactName, setContactName] = useState('');
    const [jobPostURL, setJobPostURL] = useState(initialJobPostUrl);
    const [directApplicationURL, setDirectApplicationURL] = useState('');

    const hydrateEditForm = (data: {
        jobTitle?: string;
        companyName?: string;
        location?: string;
        salaryRange?: string;
        jobPostURL?: string;
        applicationURL?: string;
        stage?: string;
    }) => {
        const nextStatus = mapStageToStatus(data.stage);
        setJobTitle(data.jobTitle || 'Untitled Job');
        setCompanyName(data.companyName || 'Unknown Company');
        setLocation(data.location || '');
        setSalaryRange(data.salaryRange || '');
        setDateApplied(new Date().toISOString().split('T')[0]);
        setJobPostURL(data.jobPostURL || initialJobPostUrl || '');
        setDirectApplicationURL(data.applicationURL || '');
        setStatus(nextStatus);
        setWorkModel('On-site');
        setInterviewStage('');
        setPriority('Medium');
        setNextAction(getDefaultNextAction(nextStatus));
        setNextActionDueDate('');
        setContactName('');
        setMode('edit');
    };

    const handleAnalyzeText = async (textToAnalyze: string) => {
        if (!textToAnalyze.trim() || !currentUser) {
            setError(t('job_tracker.modal.error_empty'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const parsedData = await parseJobDescriptionFromText(currentUser.uid, textToAnalyze, initialJobPostUrl);
            hydrateEditForm({
                jobTitle: parsedData.jobTitle || initialJobData?.jobTitle,
                companyName: parsedData.companyName || initialJobData?.companyName,
                location: parsedData.location || initialJobData?.location,
                salaryRange: parsedData.salaryRange || initialJobData?.salaryRange,
                jobPostURL: initialJobData?.jobPostURL || initialJobPostUrl || parsedData.jobPostURL,
                applicationURL: initialJobData?.applicationURL || parsedData.directApplicationURL,
                stage: initialJobData?.stage,
            });
        } catch (err: any) {
            console.error('Error parsing description:', err);
            setError(err.message || t('job_tracker.modal.error_parsing'));
            hydrateEditForm({
                jobTitle: initialJobData?.jobTitle || 'Untitled Job (Manual)',
                companyName: initialJobData?.companyName || 'Unknown Company',
                location: initialJobData?.location,
                salaryRange: initialJobData?.salaryRange,
                jobPostURL: initialJobData?.jobPostURL || initialJobPostUrl,
                applicationURL: initialJobData?.applicationURL,
                stage: initialJobData?.stage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleParseSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await handleAnalyzeText(description);
    };

    const handleSaveJob = (event: React.FormEvent) => {
        event.preventDefault();
        const jobPayload: Omit<JobApplicationData, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
            jobTitle: jobTitle || 'Untitled Job',
            companyName: companyName || 'Unknown Company',
            location: location || '',
            salaryRange: salaryRange || '',
            applicationStatus: status,
            workModel,
            interviewStage: interviewStage || '',
            dateApplied: dateApplied ? new Date(dateApplied) : null,
            jobPostURL: jobPostURL || '',
            applicationURL: directApplicationURL || '',
            jobDescription: description,
            priority,
            nextAction: nextAction || NO_NEXT_ACTION,
            nextActionDueDate: nextActionDueDate ? new Date(nextActionDueDate) : null,
            contactName: contactName || '',
        };

        if (initialJobData?.resumeId) jobPayload.resumeId = initialJobData.resumeId;
        if (initialJobData?.resumeTitle) jobPayload.resumeTitle = initialJobData.resumeTitle;
        if (initialJobData?.matchAnalyses) jobPayload.matchAnalyses = initialJobData.matchAnalyses;

        onJobAdded(jobPayload);
    };

    useEffect(() => {
        if (initialJobDescription) {
            setDescription(initialJobDescription);
        }
        if (initialJobPostUrl) {
            setJobPostURL(initialJobPostUrl);
        }
        if (hasStructuredJobData(initialJobData) && !hasHydratedStructuredJob) {
            setHasHydratedStructuredJob(true);
            setDescription(initialJobData?.jobDescription || initialJobDescription || '');
            hydrateEditForm({
                jobTitle: initialJobData?.jobTitle,
                companyName: initialJobData?.companyName,
                location: initialJobData?.location,
                salaryRange: initialJobData?.salaryRange,
                jobPostURL: initialJobData?.jobPostURL || initialJobPostUrl,
                applicationURL: initialJobData?.applicationURL,
                stage: initialJobData?.stage,
            });
            return;
        }
        if (autoSubmit && initialJobDescription && currentUser && !hasAutoSubmitted) {
            setHasAutoSubmitted(true);
            handleAnalyzeText(initialJobDescription);
        }
    }, [initialJobDescription, initialJobPostUrl, initialJobData, autoSubmit, currentUser, hasAutoSubmitted, hasHydratedStructuredJob]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300">
            <div className={`w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 dark:border-[#2e2b38] dark:bg-[#1a1820] ${mode === 'edit' ? 'max-w-4xl' : 'max-w-2xl'}`}>
                {mode === 'paste' ? (
                    <AddJobPastePanel
                        description={description}
                        setDescription={setDescription}
                        error={error}
                        isLoading={isLoading}
                        onClose={onClose}
                        onSubmit={handleParseSubmit}
                    />
                ) : (
                    <AddJobEditForm
                        initialJobData={initialJobData}
                        jobTitle={jobTitle}
                        setJobTitle={setJobTitle}
                        companyName={companyName}
                        setCompanyName={setCompanyName}
                        location={location}
                        setLocation={setLocation}
                        salaryRange={salaryRange}
                        setSalaryRange={setSalaryRange}
                        status={status}
                        setStatus={setStatus}
                        workModel={workModel}
                        setWorkModel={setWorkModel}
                        interviewStage={interviewStage}
                        setInterviewStage={setInterviewStage}
                        dateApplied={dateApplied}
                        setDateApplied={setDateApplied}
                        priority={priority}
                        setPriority={setPriority}
                        nextAction={nextAction}
                        setNextAction={setNextAction}
                        nextActionDueDate={nextActionDueDate}
                        setNextActionDueDate={setNextActionDueDate}
                        contactName={contactName}
                        setContactName={setContactName}
                        jobPostURL={jobPostURL}
                        setJobPostURL={setJobPostURL}
                        directApplicationURL={directApplicationURL}
                        setDirectApplicationURL={setDirectApplicationURL}
                        onClose={onClose}
                        onBackToPaste={() => setMode('paste')}
                        onSubmit={handleSaveJob}
                    />
                )}
            </div>
        </div>
    );
};

export default AddJobModal;
