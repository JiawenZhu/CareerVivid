import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import type { AgencyPrepSession, AgencyPrepEvent, RecruiterNote } from '../types';
import { getSessionTimestamp } from '../utils/staleCandidateUtils';

interface CandidateReadinessSnapshotProps {
  session: AgencyPrepSession;
  events: AgencyPrepEvent[];
  notes: RecruiterNote[];
}

const CandidateReadinessSnapshot: React.FC<CandidateReadinessSnapshotProps> = ({
  session,
  events,
  notes,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printableRef.current) return;
    const printContents = printableRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=850,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Readiness Snapshot - ${session.candidateName}</title>
          <style>
            @media print {
              body { background: #ffffff !important; }
            }
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              padding: 40px; 
              color: #211b16; 
              background: #fffaf1;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #e4d3bc;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .branding {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #caa26c;
            }
            .candidate-name {
              font-size: 26px;
              font-weight: 900;
              margin: 4px 0 2px;
              letter-spacing: -0.02em;
            }
            .candidate-email {
              font-size: 13px;
              color: #6b6358;
              margin: 0;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-bottom: 30px;
            }
            .metric-box {
              border: 1px solid #e4d3bc;
              border-radius: 12px;
              background: #fdf5e8;
              padding: 16px;
              text-align: center;
            }
            .metric-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #6b6358;
              margin-bottom: 4px;
            }
            .metric-value {
              font-size: 28px;
              font-weight: 900;
              color: #211b16;
              margin: 0;
            }
            .metric-value.lift {
              color: #10b981;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #8b5a16;
              border-bottom: 1px solid #e4d3bc;
              padding-bottom: 6px;
              margin: 28px 0 12px;
            }
            .timeline {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .timeline-item {
              padding-left: 20px;
              position: relative;
              margin-bottom: 12px;
              font-size: 13px;
            }
            .timeline-item::before {
              content: '';
              position: absolute;
              left: 0;
              top: 6px;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #caa26c;
            }
            .timeline-date {
              font-size: 11px;
              color: #8b5a16;
              font-weight: 600;
            }
            .notes-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .note-card {
              background: #ffffff;
              border: 1px solid #e4d3bc;
              border-radius: 8px;
              padding: 12px;
              font-size: 13px;
            }
            .note-author {
              font-size: 10px;
              font-weight: 700;
              color: #6b6358;
              margin-bottom: 4px;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e4d3bc;
              padding-top: 16px;
              text-align: center;
              font-size: 11px;
              color: #6b6358;
            }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Filter key events for clean printing
  const keyEvents = events
    .filter((e) => ['invited', 'started', 'marked_ready', 'consent_granted', 'ai_review_run', 'score_lifted'].includes(e.type))
    .sort((a, b) => getSessionTimestamp(a.createdAt) - getSessionTimestamp(b.createdAt));

  return (
    <div>
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4d3bc] bg-white px-3 py-1.5 text-xs font-bold text-[#211b16] transition hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#302e2a]"
      >
        <Printer size={12} />
        Print readiness snapshot
      </button>

      {/* Hidden region printed by print window */}
      <div ref={printableRef} className="hidden">
        <div className="header">
          <div className="branding">CareerVivid Readiness Snapshot</div>
          <h1 className="candidate-name">{session.candidateName}</h1>
          <p className="candidate-email">
            Email: {session.candidateEmail} &middot; Pilot Status: {session.status.toUpperCase()}
          </p>
        </div>

        <div className="metrics-grid">
          <div className="metric-box">
            <div className="metric-label">Current Score</div>
            <div className="metric-value">{session.latestScore ?? '—'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Starting Score</div>
            <div className="metric-value">{session.startingScore ?? '—'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Score Lift</div>
            <div className="metric-value lift">
              {typeof session.scoreDelta === 'number' && session.scoreDelta > 0
                ? `+${session.scoreDelta}`
                : '—'}
            </div>
          </div>
        </div>

        <div className="section-title">Milestone Timeline</div>
        {keyEvents.length === 0 ? (
          <p style={{ fontSize: 13, color: '#6b6358' }}>No milestone events recorded.</p>
        ) : (
          <ul className="timeline">
            {keyEvents.map((event) => {
              const dateStr = new Date(getSessionTimestamp(event.createdAt)).toLocaleDateString();
              let label: string = event.type;
              if (event.type === 'invited') label = 'Invited to prep';
              else if (event.type === 'started') label = 'Started resume prep';
              else if (event.type === 'marked_ready') label = 'Completed resume review';
              else if (event.type === 'consent_granted') label = 'Readiness shared with branch';
              else if (event.type === 'ai_review_run') label = 'Ran AI resume builder';
              else if (event.type === 'score_lifted') {
                const from = event.payload?.fromScore;
                const to = event.payload?.toScore;
                label = `Lifted score ${from ? `from ${from}` : ''} to ${to ?? '—'}`;
              }

              return (
                <li key={event.id} className="timeline-item">
                  <span className="timeline-date">[{dateStr}]</span> {label}
                </li>
              );
            })}
          </ul>
        )}

        {notes.length > 0 && (
          <>
            <div className="section-title">Recruiter Notes</div>
            <div className="notes-list">
              {notes.map((note) => {
                const dateStr = new Date(getSessionTimestamp(note.createdAt)).toLocaleDateString();
                return (
                  <div key={note.id} className="note-card">
                    <div className="note-author">
                      {note.authorName} &middot; {dateStr}
                    </div>
                    <div>{note.body}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="footer">
          Generated via CareerVivid &middot; Privacy and consent managed by candidate.
        </div>
      </div>
    </div>
  );
};

export default CandidateReadinessSnapshot;
