import React from 'react';
import {
  Activity,
  CheckCircle2,
  FileText,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import type { AgencyPrepEvent, AgencyPrepEventType } from '../types';

interface ActivityTimelineProps {
  events: AgencyPrepEvent[];
  isLoading?: boolean;
}

const EVENT_META: Record<AgencyPrepEventType, { label: string; Icon: React.ElementType; tone: 'emerald' | 'amber' | 'rose' | 'neutral' }> = {
  invited: { label: 'Invited to prep', Icon: Mail, tone: 'neutral' },
  started: { label: 'Started prep workspace', Icon: Activity, tone: 'neutral' },
  resume_selected: { label: 'Selected a resume', Icon: FileText, tone: 'neutral' },
  ai_review_run: { label: 'Ran AI review', Icon: Sparkles, tone: 'amber' },
  score_lifted: { label: 'Lifted resume score', Icon: Star, tone: 'amber' },
  marked_ready: { label: 'Marked recruiter-ready', Icon: CheckCircle2, tone: 'emerald' },
  consent_granted: { label: 'Shared readiness with the agency', Icon: Send, tone: 'emerald' },
  consent_revoked: { label: 'Revoked agency share', Icon: XCircle, tone: 'rose' },
  report_viewed_by_agency: { label: 'Agency viewed readiness report', Icon: Activity, tone: 'neutral' },
  recruiter_note_added: { label: 'Recruiter added a note', Icon: MessageSquare, tone: 'neutral' },
  reminded: { label: 'Recruiter sent a reminder nudge', Icon: Mail, tone: 'neutral' },
};

const TONE_CLASSES: Record<'emerald' | 'amber' | 'rose' | 'neutral', { dot: string; iconBg: string; iconText: string }> = {
  emerald: {
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconText: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    iconText: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    dot: 'bg-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-950/30',
    iconText: 'text-rose-700 dark:text-rose-300',
  },
  neutral: {
    dot: 'bg-[#caa26c]',
    iconBg: 'bg-[#fdf5e8] dark:bg-[#262522]',
    iconText: 'text-[#8b5a16] dark:text-[#caa26c]',
  },
};

const formatRelative = (timestamp: any): string => {
  if (!timestamp) return '';
  const ms = typeof timestamp.toMillis === 'function' ? timestamp.toMillis() : new Date(timestamp).getTime();
  if (!Number.isFinite(ms)) return '';
  const deltaSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (deltaSec < 60) return 'just now';
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)} min ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)} hr ago`;
  return `${Math.floor(deltaSec / 86400)} d ago`;
};

const formatPayloadHint = (event: AgencyPrepEvent): string | null => {
  if (event.type === 'score_lifted' && event.payload) {
    const from = event.payload.fromScore;
    const to = event.payload.toScore;
    if (typeof from === 'number' && typeof to === 'number') {
      return `${from} → ${to}`;
    }
  }
  return null;
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events, isLoading }) => {
  if (isLoading) {
    return (
      <p className="py-6 text-center text-xs text-[#6b6358] dark:text-[#aaa39a]">Loading activity…</p>
    );
  }
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[#6b6358] dark:text-[#aaa39a]">
        No activity yet. Events will appear here as the candidate progresses.
      </p>
    );
  }

  // Show in chronological order (oldest first) for a natural top-down read.
  const ordered = [...events].sort((a, b) => {
    const ta = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
    const tb = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;
    return ta - tb;
  });

  return (
    <ol className="relative space-y-3 pl-4">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-[#e4d3bc] dark:bg-[#302e2a]" aria-hidden />
      {ordered.map((event) => {
        const meta = EVENT_META[event.type] || { label: event.type, Icon: Activity, tone: 'neutral' as const };
        const toneClasses = TONE_CLASSES[meta.tone];
        const Icon = meta.Icon;
        const hint = formatPayloadHint(event);
        return (
          <li key={event.id} className="relative pl-5">
            <span className={`absolute -left-[3px] top-2 h-2.5 w-2.5 rounded-full ring-2 ring-[#fffaf1] dark:ring-[#1f1f1d] ${toneClasses.dot}`} aria-hidden />
            <div className="flex items-start gap-2.5">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClasses.iconBg} ${toneClasses.iconText}`}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#211b16] dark:text-[#f4f1e9]">
                  {meta.label}
                  {hint ? <span className="ml-1.5 text-xs font-medium text-[#6b6358] dark:text-[#aaa39a]">{hint}</span> : null}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[#6b6358] dark:text-[#aaa39a]">
                  {formatRelative(event.createdAt)}
                  {event.actorName ? ` · ${event.actorName}` : ''}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default ActivityTimeline;
