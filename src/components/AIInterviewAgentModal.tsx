import React, { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Job, PracticeHistoryEntry } from '../types';
import {
  AnalyzingPanel,
  InterviewControls,
  InterviewHeader,
  StatusPanel,
  TranscriptLog,
} from './aiInterviewAgent/AIInterviewAgentModalParts';
import { useAIInterviewAgentSession } from './aiInterviewAgent/useAIInterviewAgentSession';

const InterviewReportModal = React.lazy(() => import('./InterviewReportModal'));

interface AIInterviewAgentModalProps {
  jobId: string;
  interviewPrompt: string;
  questions: string[];
  isFirstTime: boolean;
  resumeContext: string;
  jobTitle: string;
  jobCompany: string;
  onClose: () => void;
  isGuestMode?: boolean;
}

const AIInterviewAgentModal: React.FC<AIInterviewAgentModalProps> = (props) => {
  const {
    jobId,
    interviewPrompt,
    questions,
    jobTitle,
    jobCompany,
    isGuestMode = false,
  } = props;
  const {
    status,
    transcript,
    analysisResult,
    error,
    showGreetingPrompt,
    loadingMessage,
    isPreparingAgent,
    isAgentPrepared,
    chatEndRef,
    handleClose,
    prewarmInterviewAgent,
    startInterview,
    endInterview,
    handleGetFeedback,
  } = useAIInterviewAgentSession(props);

  useEffect(() => {
    prewarmInterviewAgent();
  }, [prewarmInterviewAgent]);

  if (analysisResult) {
    const jobForReport: Job = {
      id: jobId,
      title: jobTitle,
      company: jobCompany,
      location: '',
      description: interviewPrompt,
      url: '',
    };

    const practiceHistoryEntryForReport: PracticeHistoryEntry = {
      id: jobId,
      job: jobForReport,
      questions,
      timestamp: analysisResult.timestamp,
      interviewHistory: [analysisResult],
    };

    return (
      <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>}>
        <InterviewReportModal jobHistoryEntry={practiceHistoryEntryForReport} onClose={handleClose} isGuestMode={isGuestMode} />
      </Suspense>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-interview-modal-title"
        aria-describedby="ai-interview-modal-description"
        className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900"
      >
        <InterviewHeader interviewPrompt={interviewPrompt} onClose={handleClose} />
        <StatusPanel
          status={status}
          error={error}
          isPreparingAgent={isPreparingAgent}
          isAgentPrepared={isAgentPrepared}
        />
        {status === 'analyzing' ? (
          <AnalyzingPanel message={loadingMessage} />
        ) : (
          <TranscriptLog
            transcript={transcript}
            showGreetingPrompt={showGreetingPrompt}
            error={error}
            chatEndRef={chatEndRef}
          />
        )}
        <InterviewControls
          status={status}
          hasTranscript={transcript.length > 0}
          hasAnalysisResult={!!analysisResult}
          isPreparingAgent={isPreparingAgent}
          isAgentPrepared={isAgentPrepared}
          onStart={startInterview}
          onEnd={endInterview}
          onGetFeedback={handleGetFeedback}
        />
      </div>
    </div>
  );
};

export default AIInterviewAgentModal;
