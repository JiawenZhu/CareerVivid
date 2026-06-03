// Client-side CSV/printable export for the Pilot Metrics tab.
//
// Privacy guardrail: exports include only progress fields. Resume content,
// AI Review details, and recruiter notes are NEVER included.

import type { AgencyBranchProfile, AgencyPrepSession } from '../types';
import { minutesSavedFor } from '../utils/timeSaved';

const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const CSV_HEADERS = [
  'Candidate',
  'Email',
  'Status',
  'Starting Score',
  'Latest Score',
  'Score Delta',
  'Started',
  'Shared',
  'Time Saved (min)',
];

/** Build a CSV blob of all sessions for a branch. Returns the blob URL. */
export const buildSessionsCsv = (sessions: AgencyPrepSession[]): string => {
  const rows = sessions.map((session) => [
    session.candidateName,
    session.candidateEmail,
    session.status,
    session.startingScore ?? '',
    session.latestScore ?? '',
    session.scoreDelta ?? '',
    formatTimestamp(session.startedAt),
    formatTimestamp(session.sharedAt),
    minutesSavedFor(session),
  ].map(escapeCsvCell).join(','));

  const csv = [CSV_HEADERS.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  return URL.createObjectURL(blob);
};

/** Build a download filename. */
export const buildExportFilename = (branch: AgencyBranchProfile | null): string => {
  const slug = branch?.slug || 'agency';
  const date = new Date().toISOString().slice(0, 10);
  return `careervivid-${slug}-pilot-${date}.csv`;
};
