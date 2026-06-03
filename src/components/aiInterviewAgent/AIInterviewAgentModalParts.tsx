import React from 'react';
import { BarChart, Bot, Loader2, Mic, StopCircle, User, X } from 'lucide-react';
import { InterviewStatus, TranscriptEntry } from '../../types';

type StatusTone = 'green' | 'blue' | 'amber' | 'red' | 'gray';

const statusToneClasses: Record<StatusTone, {
  dot: string;
  ping: string;
  panel: string;
  ring: string;
}> = {
  green: {
    dot: 'bg-green-500',
    ping: 'bg-green-400',
    panel: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200',
    ring: 'ring-green-500/20',
  },
  blue: {
    dot: 'bg-blue-500',
    ping: 'bg-blue-400',
    panel: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200',
    ring: 'ring-blue-500/20',
  },
  amber: {
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
    panel: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    ring: 'ring-amber-500/20',
  },
  red: {
    dot: 'bg-red-500',
    ping: 'bg-red-400',
    panel: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200',
    ring: 'ring-red-500/20',
  },
  gray: {
    dot: 'bg-gray-400',
    ping: 'bg-gray-300',
    panel: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200',
    ring: 'ring-gray-500/10',
  },
};

const getStatusMeta = (
  status: InterviewStatus,
  preparation?: { isPreparingAgent?: boolean; isAgentPrepared?: boolean },
): { label: string; description: string; tone: StatusTone } => {
  if (status === 'idle' && preparation?.isPreparingAgent) {
    return { label: 'Warming up', description: 'The live agent is warming in the background. You can start anytime.', tone: 'amber' };
  }
  if (status === 'idle' && preparation?.isAgentPrepared) {
    return { label: 'Ready', description: 'Agent is warmed up. Start when you are ready.', tone: 'green' };
  }

  switch (status) {
    case 'connecting':
      return { label: 'Connecting', description: 'Preparing the live interview session.', tone: 'amber' };
    case 'listening':
      return { label: 'Listening', description: 'Your microphone is active. Vivid is listening.', tone: 'green' };
    case 'speaking':
      return { label: 'Speaking', description: 'Vivid is responding. Your microphone is muted while audio plays.', tone: 'blue' };
    case 'analyzing':
      return { label: 'Analyzing', description: 'Generating your feedback report.', tone: 'amber' };
    case 'ended':
      return { label: 'Interview Ended', description: 'The live session has ended.', tone: 'red' };
    case 'error':
      return { label: 'Error', description: 'The interview needs attention before it can continue.', tone: 'red' };
    default:
      return { label: 'Ready', description: 'Start when you are ready to begin.', tone: 'gray' };
  }
};

export const InterviewHeader: React.FC<{
  interviewPrompt: string;
  onClose: () => void;
}> = ({ interviewPrompt, onClose }) => (
  <header className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
    <div className="min-w-0">
      <h2 id="ai-interview-modal-title" className="text-lg font-bold text-gray-950 dark:text-white">
        AI Interview Agent
      </h2>
      <p id="ai-interview-modal-description" className="mt-1 max-w-2xl truncate text-sm text-gray-500 dark:text-gray-400">
        Topic: {interviewPrompt}
      </p>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Close AI interview agent"
      className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <X size={20} aria-hidden="true" />
    </button>
  </header>
);

const AudioActivityVisual: React.FC<{ status: InterviewStatus }> = ({ status }) => {
  const meta = getStatusMeta(status);
  const tone = statusToneClasses[meta.tone];
  const isActive = status === 'listening' || status === 'speaking' || status === 'connecting' || status === 'analyzing';
  const bars = status === 'speaking' ? ['h-5', 'h-8', 'h-4', 'h-7', 'h-6'] : ['h-3', 'h-5', 'h-4', 'h-6', 'h-3'];

  return (
    <div className={`flex h-12 w-16 items-center justify-center gap-1 rounded-xl bg-white/70 ring-4 ${tone.ring} dark:bg-gray-950/30`} aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={`${status}-${index}`}
          className={`w-1.5 rounded-full ${height} ${tone.dot} ${isActive ? 'motion-safe:animate-pulse motion-reduce:animate-none' : 'opacity-45'}`}
          style={isActive ? { animationDelay: `${index * 120}ms` } : undefined}
        />
      ))}
    </div>
  );
};

export const StatusPanel: React.FC<{
  status: InterviewStatus;
  error: string | null;
  isPreparingAgent?: boolean;
  isAgentPrepared?: boolean;
}> = ({ status, error, isPreparingAgent, isAgentPrepared }) => {
  const meta = getStatusMeta(status, { isPreparingAgent, isAgentPrepared });
  const tone = statusToneClasses[meta.tone];
  const visualStatus = status === 'idle' && isPreparingAgent ? 'connecting' : status;
  const shouldSpin = status === 'connecting' || status === 'analyzing' || (status === 'idle' && isPreparingAgent);
  const isLive = status === 'listening' || status === 'speaking';

  return (
    <section className={`border px-5 py-4 ${tone.panel}`} aria-labelledby="ai-interview-status-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
            {isLive && <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping motion-reduce:animate-none ${tone.ping}`} />}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${tone.dot}`} />
          </span>
          <div>
            <h3 id="ai-interview-status-heading" className="text-sm font-semibold uppercase tracking-wide">
              Session status
            </h3>
            <p className="mt-0.5 flex items-center gap-2 text-base font-bold" aria-live="polite" aria-atomic="true">
              {shouldSpin && <Loader2 className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {meta.label}
            </p>
            <p className="mt-1 text-sm opacity-85">{error || meta.description}</p>
          </div>
        </div>
        <AudioActivityVisual status={visualStatus} />
      </div>
    </section>
  );
};

const MessageBubble: React.FC<{ entry: TranscriptEntry }> = ({ entry }) => {
  const isUser = entry.speaker === 'user';
  const speakerLabel = isUser ? 'You' : 'Vivid';

  return (
    <article className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex max-w-full items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${isUser ? 'bg-gray-600' : 'bg-blue-600'}`} aria-hidden="true">
          {isUser ? <User size={17} /> : <Bot size={17} />}
        </div>
        <div className={`max-w-[min(34rem,80vw)] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'}`}>
          <p className="mb-1 text-xs font-semibold opacity-75">{speakerLabel}</p>
          <p className="whitespace-pre-wrap leading-relaxed">{entry.text}</p>
        </div>
      </div>
      {entry.isFinal && entry.timestamp && (
        <time className="mt-1 px-11 text-xs text-gray-400 dark:text-gray-500" dateTime={new Date(entry.timestamp).toISOString()}>
          {new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </time>
      )}
    </article>
  );
};

export const TranscriptLog: React.FC<{
  transcript: TranscriptEntry[];
  showGreetingPrompt: boolean;
  error: string | null;
  chatEndRef: React.RefObject<HTMLDivElement>;
}> = ({ transcript, showGreetingPrompt, error, chatEndRef }) => (
  <section className="flex-1 overflow-y-auto bg-gray-50 px-5 py-5 dark:bg-gray-950/60" aria-labelledby="ai-interview-transcript-heading">
    <h3 id="ai-interview-transcript-heading" className="sr-only">
      Interview transcript
    </h3>
    <div role="log" aria-live="polite" aria-relevant="additions text" className="space-y-4">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {showGreetingPrompt && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-white p-5 text-center shadow-sm motion-safe:animate-pulse motion-reduce:animate-none dark:border-green-900/60 dark:bg-gray-900">
          <Mic className="mb-3 h-10 w-10 text-green-500" aria-hidden="true" />
          <p className="font-semibold text-gray-800 dark:text-gray-100">The AI is ready.</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Say "Hello" or "Hi" to begin.</p>
        </div>
      )}

      {transcript.length === 0 && !showGreetingPrompt && !error && (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          Your live transcript will appear here.
        </div>
      )}

      {transcript.map((entry, index) => (
        <MessageBubble key={`${entry.speaker}-${entry.timestamp ?? index}-${index}`} entry={entry} />
      ))}
      <div ref={chatEndRef} />
    </div>
  </section>
);

export const AnalyzingPanel: React.FC<{ message: string }> = ({ message }) => (
  <section className="flex flex-1 items-center justify-center bg-gray-50 px-5 py-10 text-center dark:bg-gray-950/60" aria-labelledby="ai-interview-analyzing-heading">
    <div className="max-w-md">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-500/10 dark:bg-amber-950/30">
        <Loader2 className="h-10 w-10 text-amber-500 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
      </div>
      <h3 id="ai-interview-analyzing-heading" className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
        Generating your feedback report
      </h3>
      <p key={message} className="mt-2 text-sm text-gray-500 motion-safe:animate-pulse motion-reduce:animate-none dark:text-gray-400" aria-live="polite">
        {message}
      </p>
    </div>
  </section>
);

export const InterviewControls: React.FC<{
  status: InterviewStatus;
  hasTranscript: boolean;
  hasAnalysisResult: boolean;
  isPreparingAgent?: boolean;
  isAgentPrepared?: boolean;
  onStart: () => void;
  onEnd: () => void;
  onGetFeedback: () => void;
}> = ({ status, hasTranscript, hasAnalysisResult, isPreparingAgent, isAgentPrepared, onStart, onEnd, onGetFeedback }) => (
  <footer className="flex items-center justify-center border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:justify-between">
    <div className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
      {status === 'ended'
        ? 'Session complete'
        : status === 'idle' && isPreparingAgent
          ? 'Agent warming in background'
          : status === 'idle' && isAgentPrepared
            ? 'Agent ready'
            : status === 'idle' || status === 'error'
              ? 'Ready to begin'
              : 'Live interview in progress'}
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      {status !== 'idle' && status !== 'ended' && status !== 'error' && (
        <button
          type="button"
          onClick={onEnd}
          disabled={status === 'analyzing'}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-400 dark:focus:ring-offset-gray-900"
        >
          <StopCircle size={18} aria-hidden="true" /> End Interview
        </button>
      )}
      {(status === 'idle' || status === 'error') && (
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <Mic size={18} aria-hidden="true" /> Start Interview
        </button>
      )}
      {status === 'ended' && hasTranscript && !hasAnalysisResult && (
        <button
          type="button"
          onClick={onGetFeedback}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <BarChart size={18} aria-hidden="true" /> Get Feedback
        </button>
      )}
    </div>
  </footer>
);
