import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { InterviewAnalysis, PracticeHistoryEntry } from '../types';
import FeedbackModal from './FeedbackModal';
import { useAuth } from '../contexts/AuthContext';
import {
    CoachingDashboard,
    ReportActions,
    ReportTabs,
    SessionSelector,
    TranscriptView,
} from './interviewReport/InterviewReportSections';
import { ReportTab, TranscriptFallback, resolveTranscript } from './interviewReport/reportShared';
import { useInterviewReportExport } from './interviewReport/useInterviewReportExport';

interface InterviewReportModalProps {
    jobHistoryEntry: PracticeHistoryEntry;
    onClose: () => void;
    isGuestMode?: boolean;
}

const InterviewReportModal: React.FC<InterviewReportModalProps> = ({ jobHistoryEntry, onClose, isGuestMode = false }) => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<ReportTab>('feedback');
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const sortedHistory = useMemo(() => {
        if (!jobHistoryEntry?.interviewHistory) return [];
        return [...jobHistoryEntry.interviewHistory].sort((a, b) => b.timestamp - a.timestamp);
    }, [jobHistoryEntry.interviewHistory]);

    const [currentAnalysis, setCurrentAnalysis] = useState<InterviewAnalysis | null>(sortedHistory[0] || null);
    const {
        isDownloading,
        isExportingDocument,
        handleDownloadTxt,
        handleDownloadPdf,
        handleGoogleDocsExport,
    } = useInterviewReportExport({
        currentAnalysis,
        currentUser,
        jobHistoryEntry,
    });

    useEffect(() => {
        if (sortedHistory[0] && (!currentAnalysis || !sortedHistory.some(item => item.id === currentAnalysis.id))) {
            setCurrentAnalysis(sortedHistory[0]);
        }
    }, [currentAnalysis, sortedHistory]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isFeedbackModalOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFeedbackModalOpen, onClose]);

    const currentTranscriptFallback = useMemo<TranscriptFallback>(() => {
        if (!currentAnalysis) {
            return {
                entries: [],
                sourceLabel: 'Transcript unavailable',
            };
        }

        return resolveTranscript(currentAnalysis, jobHistoryEntry);
    }, [currentAnalysis, jobHistoryEntry]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171411]/70 p-1.5 backdrop-blur-sm sm:p-3">
            {isFeedbackModalOpen && currentAnalysis && (
                <FeedbackModal
                    isOpen={isFeedbackModalOpen}
                    onClose={() => setIsFeedbackModalOpen(false)}
                    source="interview"
                    context={{
                        jobId: jobHistoryEntry.id,
                        jobTitle: jobHistoryEntry.job.title,
                        analysisId: currentAnalysis.id,
                    }}
                />
            )}

            <div className="flex h-[calc(100vh-0.75rem)] w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:h-[calc(100vh-1.5rem)] md:max-w-7xl md:flex-row">
                <SessionSelector sortedHistory={sortedHistory} currentAnalysis={currentAnalysis} onSelect={setCurrentAnalysis} variant="sidebar" />

                <div className="flex min-w-0 flex-grow flex-col overflow-hidden">
                    <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b p-4 dark:border-gray-700">
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Interview Report</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {currentAnalysis ? `Analysis from ${new Date(currentAnalysis.timestamp).toLocaleString()}` : 'No session selected'}
                            </p>
                        </div>
                        <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
                            <X size={20} />
                        </button>
                    </header>

                    {currentAnalysis ? (
                        <>
                            <div className="flex flex-shrink-0 flex-col gap-3 border-b bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50 md:flex-row md:items-center md:justify-between">
                                <SessionSelector sortedHistory={sortedHistory} currentAnalysis={currentAnalysis} onSelect={setCurrentAnalysis} variant="select" />
                                <ReportTabs activeTab={activeTab} onChange={setActiveTab} />
                            </div>

                            <div className="flex-grow overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900/50 md:p-6">
                                {activeTab === 'feedback' ? (
                                    <CoachingDashboard analysis={currentAnalysis} />
                                ) : (
                                    <TranscriptView transcript={currentTranscriptFallback.entries} sourceLabel={currentTranscriptFallback.sourceLabel} />
                                )}
                            </div>

                            <ReportActions
                                isGuestMode={isGuestMode}
                                isDownloading={isDownloading}
                                isExportingDocument={isExportingDocument}
                                onDownloadTxt={handleDownloadTxt}
                                onDownloadPdf={handleDownloadPdf}
                                onExportGoogleDocs={() => handleGoogleDocsExport('google-docs')}
                                onDownloadDocx={() => handleGoogleDocsExport('docx')}
                                onRateReport={() => setIsFeedbackModalOpen(true)}
                            />
                        </>
                    ) : (
                        <div className="flex flex-grow items-center justify-center">
                            <p className="text-gray-500">No report available for this session.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewReportModal;
