import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import StatusOverview from './StatusOverview';
import JobCard from './JobCard';
import KanbanBoard from './KanbanBoard';
import { JobApplicationData } from '../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const copy: Record<string, string> = {
        'job_tracker.total': 'Total',
        'job_tracker.status_overview': 'Status Overview',
      };
      return copy[key] || key;
    },
  }),
}));

const makeJob = (overrides: Partial<JobApplicationData> = {}): JobApplicationData => ({
  id: overrides.id || 'job-1',
  userId: 'user-1',
  jobTitle: 'Senior Product Engineer With A Very Long Platform Infrastructure Title',
  companyName: 'OpenAI',
  jobPostURL: 'https://example.com/job',
  applicationStatus: 'To Apply',
  workModel: 'Remote',
  interviewStage: 'Recruiter Screen',
  location: 'San Francisco, CA',
  salaryRange: '$180K - $220K',
  priority: 'High',
  nextAction: 'Send follow-up email',
  nextActionDueDate: new Date('2020-01-01T12:00:00Z'),
  contactName: 'Avery Recruiter',
  prep_RoleOverview: 'Role notes',
  prep_MyStory: 'Story notes',
  matchAnalyses: {
    resume1: {
      totalKeywords: 10,
      matchedKeywords: ['React'],
      missingKeywords: ['Kubernetes'],
      matchPercentage: 82,
      summary: 'Strong match',
    },
  },
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-03T00:00:00Z'),
  ...overrides,
});

describe('Job Tracker compact components', () => {
  it('shows compact summary counts including overdue next actions', () => {
    render(
      <StatusOverview
        variant="compact"
        applications={[
          makeJob({ id: 'job-1', applicationStatus: 'To Apply', nextActionDueDate: new Date('2020-01-01') }),
          makeJob({ id: 'job-2', applicationStatus: 'Interviewing', nextActionDueDate: new Date('2099-01-01') }),
          makeJob({ id: 'job-3', applicationStatus: 'Offered', nextActionDueDate: new Date('2020-01-01') }),
          makeJob({ id: 'job-4', applicationStatus: 'Rejected' }),
        ]}
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getAllByText('4')[0]).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(3);
  });

  it('renders rich compact job card metadata and old jobs safely', () => {
    const onUpdate = vi.fn();
    render(<JobCard job={makeJob()} onClick={vi.fn()} onUpdate={onUpdate} />);

    expect(screen.getByText(/Senior Product Engineer/)).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Send follow-up email')).toBeInTheDocument();
    expect(screen.getByText('$180K - $220K')).toBeInTheDocument();
    expect(screen.getByText('82% match')).toBeInTheDocument();
    expect(screen.getByText('Prep 2/5')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();

    render(<JobCard job={makeJob({ id: 'legacy', priority: undefined, nextAction: undefined, matchAnalyses: undefined })} onClick={vi.fn()} onUpdate={onUpdate} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('updates status when a card is dropped into another column', () => {
    const onUpdate = vi.fn();
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, value: string) {
        this.data[type] = value;
      },
      getData(type: string) {
        return this.data[type];
      },
    };

    render(
      <KanbanBoard
        applications={[makeJob({ id: 'job-1', applicationStatus: 'To Apply' })]}
        onCardClick={vi.fn()}
        onUpdateApplication={onUpdate}
      />
    );

    fireEvent.dragStart(screen.getByText(/Senior Product Engineer/).closest('[draggable="true"]')!, { dataTransfer });
    fireEvent.drop(screen.getByText('Applied').closest('div')!, { dataTransfer });

    expect(onUpdate).toHaveBeenCalledWith('job-1', { applicationStatus: 'Applied' });
  });

  it('switches crowded columns into queue manager mode', () => {
    const applications = Array.from({ length: 9 }, (_, index) => makeJob({
      id: `job-${index + 1}`,
      jobTitle: `Applied Role ${index + 1}`,
      applicationStatus: 'Applied',
      updatedAt: new Date(`2026-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`),
    }));

    render(
      <KanbanBoard
        applications={applications}
        onCardClick={vi.fn()}
        onUpdateApplication={vi.fn()}
      />
    );

    expect(screen.getByText('Queue manager')).toBeInTheDocument();
    expect(screen.getByText('1-8 of 9')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Find applied jobs')).toBeInTheDocument();
    expect(screen.getAllByText('No description').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    expect(screen.getByText('9-9 of 9')).toBeInTheDocument();
  });
});
