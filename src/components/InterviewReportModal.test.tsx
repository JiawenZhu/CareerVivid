import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import InterviewReportModal from './InterviewReportModal';
import { PracticeHistoryEntry } from '../types';

vi.mock('./FeedbackModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog" aria-label="Feedback dialog">Feedback dialog</div> : null),
}));

const jobHistoryEntry: PracticeHistoryEntry = {
  id: 'history-1',
  job: {
    id: 'job-1',
    title: 'Robotics Lab Technician',
    company: 'OpenAI',
    location: 'San Francisco',
    description: 'Maintain robotics lab equipment.',
    url: 'https://example.com/job',
  },
  questions: ['Tell me about your lab experience.'],
  timestamp: Date.now(),
  transcript: [
    { speaker: 'ai', text: 'Fallback prompt', isFinal: true, timestamp: 1 },
    { speaker: 'user', text: 'Fallback answer', isFinal: true, timestamp: 2 },
  ],
  interviewHistory: [
    {
      id: 'analysis-1',
      timestamp: 1716600000000,
      overallScore: 72,
      communicationScore: 80,
      confidenceScore: 64,
      relevanceScore: 70,
      strengths: '**Structured** answers with clear examples.',
      areasForImprovement: 'Practice deeper technical examples.',
      transcript: [
        { speaker: 'ai', text: 'Why this role?', isFinal: true, timestamp: 3 },
        { speaker: 'user', text: 'I enjoy hands-on systems work.', isFinal: true, timestamp: 4 },
      ],
    },
    {
      id: 'analysis-2',
      timestamp: 1716500000000,
      overallScore: 45,
      communicationScore: 50,
      confidenceScore: 40,
      relevanceScore: 45,
      strengths: 'Shows curiosity.',
      areasForImprovement: 'Use STAR stories.',
      transcript: [],
    },
  ],
};

describe('InterviewReportModal', () => {
  it('renders the coaching dashboard and switches to transcript view', () => {
    render(<InterviewReportModal jobHistoryEntry={jobHistoryEntry} onClose={vi.fn()} />);

    expect(screen.getAllByText('Top summary')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Metric breakdown')[0]).toBeInTheDocument();
    expect(screen.getAllByText('What went well')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Practice next')[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /transcript/i }));

    expect(screen.getAllByText('Why this role?')[0]).toBeInTheDocument();
    expect(screen.getAllByText('I enjoy hands-on systems work.')[0]).toBeInTheDocument();
  });

  it('uses shared transcript fallback when the selected analysis has no transcript', () => {
    render(<InterviewReportModal jobHistoryEntry={jobHistoryEntry} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Session'), { target: { value: 'analysis-2' } });
    fireEvent.click(screen.getByRole('button', { name: /transcript/i }));

    expect(screen.getAllByText(/Recovered from the practice session/)[0]).toBeInTheDocument();
    expect(screen.getAllByText('Fallback prompt')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Fallback answer')[0]).toBeInTheDocument();
  });

  it('opens feedback from the inline rate action and closes on Escape', () => {
    const onClose = vi.fn();
    render(<InterviewReportModal jobHistoryEntry={jobHistoryEntry} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /rate this report/i }));
    expect(screen.getByRole('dialog', { name: 'Feedback dialog' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
