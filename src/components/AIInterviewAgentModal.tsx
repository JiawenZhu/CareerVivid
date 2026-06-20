import React, { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Job, PracticeHistoryEntry } from '../types';
import {
  AnalyzingPanel,
  EncounterBriefPanel,
  InterviewControls,
  InterviewHeader,
  LiveObserverPanel,
  QuestionQueuePanel,
  SessionMapPanel,
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
    <div className="fixed inset-0 z-50 bg-[#171411]/70 p-2 backdrop-blur-sm sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-interview-modal-title"
        aria-describedby="ai-interview-modal-description"
        className="mx-auto flex h-[calc(100vh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-[#e7d8c5] bg-[#f7f1e7] shadow-2xl dark:border-[#3b3730] dark:bg-[#1f1f1d] sm:h-[calc(100vh-2rem)]"
      >
        <InterviewHeader
          interviewPrompt={interviewPrompt}
          jobTitle={jobTitle}
          jobCompany={jobCompany}
          onClose={handleClose}
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid min-h-full gap-3 lg:grid-cols-[280px_minmax(0,1fr)_280px] xl:grid-cols-[310px_minmax(0,1fr)_310px]">
            <div className="space-y-3 lg:overflow-y-auto lg:pr-1">
              <EncounterBriefPanel
                jobTitle={jobTitle}
                jobCompany={jobCompany}
                interviewPrompt={interviewPrompt}
                questions={questions}
              />
              <QuestionQueuePanel questions={questions} transcript={transcript} />
            </div>

            <main className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-[#e7d8c5] bg-white shadow-sm dark:border-[#3b3730] dark:bg-[#262522] lg:min-h-0">
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
            </main>

            <div className="space-y-3 lg:overflow-y-auto lg:pl-1">
              <LiveObserverPanel status={status} transcript={transcript} />
              <SessionMapPanel status={status} hasTranscript={transcript.length > 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewAgentModal;
