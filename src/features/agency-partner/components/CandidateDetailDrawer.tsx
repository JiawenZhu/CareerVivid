import React, { useEffect } from 'react';
import { ExternalLink, Lock, Mail, X } from 'lucide-react';
import type { AgencyPrepSession } from '../types';
import { agencyPrepStatusLabels } from '../../../utils/agencyPartnerUtils';
import { useAgencyPrepEvents } from '../hooks/useAgencyPrepEvents';
import { useRecruiterNotes } from '../hooks/useRecruiterNotes';
import { minutesSavedFor } from '../utils/timeSaved';
import ActivityTimeline from './ActivityTimeline';
import RecruiterNotesPanel from './RecruiterNotesPanel';
import TimeSavedBadge from './TimeSavedBadge';
import PositionTagInput from './PositionTagInput';
import CandidateReadinessSnapshot from './CandidateReadinessSnapshot';

interface CandidateDetailDrawerProps {
  session: AgencyPrepSession | null;
  canManageNotes: boolean;
  onClose: () => void;
}

const CandidateDetailDrawer: React.FC<CandidateDetailDrawerProps> = ({ session, canManageNotes, onClose }) => {
  const { events, isLoading: eventsLoading } = useAgencyPrepEvents(session?.id || null);
  const { notes, isLoading: notesLoading } = useRecruiterNotes(session?.id || null);

  // Close on Escape
  useEffect(() => {
    if (!session) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, onClose]);

  if (!session) return null;

  const minutesSaved = minutesSavedFor(session);

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close candidate detail"
        onClick={onClose}
        className="absolute inset-0 bg-[#211b16]/35 backdrop-blur-[1px]"
      />
      <aside
        role="dialog"
        aria-label={`Candidate detail for ${session.candidateName}`}
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-[#e4d3bc] bg-[#fffaf1] shadow-xl dark:border-[#302e2a] dark:bg-[#1f1f1d]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#e4d3bc] px-5 py-4 dark:border-[#302e2a]">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b5a16] dark:text-[#caa26c]">
              {agencyPrepStatusLabels[session.status] || session.status}
            </p>
            <h2 className="mt-1 truncate text-lg font-bold text-[#211b16] dark:text-[#f4f1e9]">
              {session.candidateName}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[#6b6358] dark:text-[#aaa39a]">
              <Mail size={11} /> {session.candidateEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6b6358] transition hover:bg-[#fdf5e8] hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:bg-[#262522] dark:hover:text-[#f4f1e9]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <section className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-3 dark:border-[#302e2a] dark:bg-[#262522]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6358] dark:text-[#aaa39a]">Score</p>
              <p className="mt-1 text-xl font-bold text-[#211b16] dark:text-[#f4f1e9]">{session.latestScore ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-3 dark:border-[#302e2a] dark:bg-[#262522]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6358] dark:text-[#aaa39a]">Lift</p>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-300">
                {typeof session.scoreDelta === 'number' && session.scoreDelta > 0 ? `+${session.scoreDelta}` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-3 dark:border-[#302e2a] dark:bg-[#262522]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6358] dark:text-[#aaa39a]">Saved</p>
              <p className="mt-1 text-xl font-bold text-[#8b5a16] dark:text-[#caa26c]">
                {minutesSaved > 0 ? `${minutesSaved}m` : '—'}
              </p>
            </div>
          </section>

          <section className="mt-5">
            <PositionTagInput
              sessionId={session.id}
              branchId={session.agencyBranchId}
              initialTags={session.positionTags}
              canEdit={canManageNotes}
            />
          </section>

          <section className="mt-5 rounded-xl border border-[#e4d3bc] bg-white p-4 dark:border-[#302e2a] dark:bg-[#262522]">
            <h3 className="mb-3 text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">Activity</h3>
            <ActivityTimeline events={events} isLoading={eventsLoading} />
          </section>

          <section className="mt-5">
            <RecruiterNotesPanel
              sessionId={session.id}
              notes={notes}
              canManage={canManageNotes}
              isLoading={notesLoading}
            />
          </section>

          <section className="mt-5 rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-4 dark:border-[#302e2a] dark:bg-[#1f1f1d]">
            <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">Resume access</h3>
            {session.consentToShare && session.resumeSharePath ? (
              <>
                <p className="mt-1 text-xs text-[#6b6358] dark:text-[#aaa39a]">
                  Candidate has shared a viewer-only resume link.
                </p>
                <a
                  href={session.resumeSharePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#e4d3bc] bg-white px-3 py-1.5 text-xs font-bold text-[#211b16] transition hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#302e2a]"
                >
                  Open candidate resume <ExternalLink size={12} />
                </a>
              </>
            ) : (
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6b6358] dark:text-[#aaa39a]">
                <Lock size={12} /> Candidate has not shared resume access yet.
              </p>
            )}
          </section>

          <section className="mt-5 flex items-center justify-between gap-3">
            <CandidateReadinessSnapshot session={session} events={events} notes={notes} />
            <TimeSavedBadge minutes={minutesSaved} />
          </section>
        </div>
      </aside>
    </div>
  );
};

export default CandidateDetailDrawer;
