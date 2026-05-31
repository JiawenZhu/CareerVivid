import React from 'react';
import type { AgencyInvite, AgencyPrepSession } from '../types';

interface PendingInvitesListProps {
  invites: AgencyInvite[];
  sessions: AgencyPrepSession[];
  isLoading?: boolean;
}

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '—';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const STATUS_TINT: Record<string, string> = {
  sent: 'bg-[#fdf5e8] text-[#8b5a16] dark:bg-[#262522] dark:text-[#caa26c]',
  started: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  shared: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
  bounced: 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200',
};

const PendingInvitesList: React.FC<PendingInvitesListProps> = ({ invites, sessions, isLoading }) => {
  // Derive each invite's "lived" status by matching against the prep sessions
  // by email. If a session exists and has progressed, surface the better status.
  const sessionsByEmail = new Map<string, AgencyPrepSession>();
  for (const session of sessions) {
    if (session.candidateEmail) sessionsByEmail.set(session.candidateEmail.toLowerCase(), session);
  }

  const enriched = invites.map((invite) => {
    const matched = sessionsByEmail.get(invite.email.toLowerCase());
    let liveStatus = invite.status;
    if (matched) {
      if (matched.consentToShare || matched.status === 'shared') liveStatus = 'shared';
      else if (matched.status === 'ready') liveStatus = 'ready';
      else if (matched.status !== 'invited') liveStatus = 'started';
    }
    return { invite, matched, liveStatus };
  });

  return (
    <section className="rounded-2xl border border-[#e4d3bc] bg-white p-5 dark:border-[#302e2a] dark:bg-[#1f1f1d]">
      <header className="mb-3">
        <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">Pending invites</h3>
        <p className="text-xs text-[#6b6358] dark:text-[#aaa39a]">
          Status updates automatically as candidates start, get ready, and share.
        </p>
      </header>

      {isLoading ? (
        <p className="py-6 text-center text-xs text-[#6b6358] dark:text-[#aaa39a]">Loading invites…</p>
      ) : enriched.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#6b6358] dark:text-[#aaa39a]">
          No invites yet. Send your first one from the form above.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6358] dark:text-[#aaa39a]">
              <tr>
                <th className="px-2 py-2">Candidate</th>
                <th className="px-2 py-2">Sent</th>
                <th className="px-2 py-2">Sent by</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4d3bc] dark:divide-[#302e2a]">
              {enriched.map(({ invite, liveStatus }) => (
                <tr key={invite.id}>
                  <td className="px-2 py-2.5">
                    <p className="text-[13px] font-bold text-[#211b16] dark:text-[#f4f1e9]">{invite.firstName || invite.email.split('@')[0]}</p>
                    <p className="text-[11px] text-[#6b6358] dark:text-[#aaa39a]">{invite.email}</p>
                  </td>
                  <td className="px-2 py-2.5 text-[12px] text-[#6b6358] dark:text-[#aaa39a]">{formatTimestamp(invite.createdAt)}</td>
                  <td className="px-2 py-2.5 text-[12px] text-[#6b6358] dark:text-[#aaa39a]">{invite.sentByName || '—'}</td>
                  <td className="px-2 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_TINT[liveStatus] || STATUS_TINT.sent}`}>
                      {liveStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default PendingInvitesList;
