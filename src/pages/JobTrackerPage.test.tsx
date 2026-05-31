import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JobTrackerPage from './JobTrackerPage';
import { JobApplicationData } from '../types';

const { mockJobs, mockUpdateJob, mockDeleteJob, mockAddJob } = vi.hoisted(() => ({
  mockJobs: [] as JobApplicationData[],
  mockUpdateJob: vi.fn(),
  mockDeleteJob: vi.fn(),
  mockAddJob: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const copy: Record<string, string> = {
        'job_tracker.title': 'Career Pipeline',
        'job_tracker.subtitle': 'Track applications and prep work',
        'job_tracker.track_new': 'Track New Job',
        'job_tracker.loading': 'Loading jobs',
        'nav.dashboard': 'Dashboard',
      };
      return copy[key] || key;
    },
  }),
}));

vi.mock('../components/Layout/AppLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-1', email: 'user@example.com' } }),
}));

vi.mock('../contexts/NavigationContext', () => ({
  useNavigation: () => ({ navPosition: 'side' }),
}));

vi.mock('../hooks/useResumes', () => ({
  useResumes: () => ({ resumes: [] }),
}));

vi.mock('../hooks/useJobTracker', () => ({
  useJobTracker: () => ({
    jobApplications: mockJobs,
    isLoading: false,
    addJobApplication: mockAddJob,
    updateJobApplication: mockUpdateJob,
    deleteJobApplication: mockDeleteJob,
  }),
}));

vi.mock('../components/JobTracker/StrategyMap', () => ({
  default: ({ applications }: { applications: JobApplicationData[] }) => (
    <div data-testid="strategy-map">{applications.map(job => <span key={job.id}>{job.jobTitle}</span>)}</div>
  ),
}));

vi.mock('../components/JobTracker/JobDetailModal', () => ({
  default: ({ job, onClose }: { job: JobApplicationData; onClose: () => void }) => (
    <div role="dialog" aria-label="Job detail">
      {job.jobTitle}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../components/JobTracker/AddJobUrlModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Track new job">
      <button onClick={onClose}>Cancel</button>
    </div>
  ),
}));

vi.mock('../utils/navigation', () => ({
  navigate: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

const makeJob = (overrides: Partial<JobApplicationData>): JobApplicationData => ({
  id: overrides.id || 'job-1',
  userId: 'user-1',
  jobTitle: 'Robotics 3D Printing Lab Technician',
  companyName: 'OpenAI',
  jobPostURL: 'https://example.com/job',
  applicationStatus: 'To Apply',
  workModel: 'On-site',
  interviewStage: 'Interview Stage',
  priority: 'Medium',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  ...overrides,
});

describe('JobTrackerPage operations dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJobs.length = 0;
    mockJobs.push(
      makeJob({
        id: 'openai',
        jobTitle: 'Robotics 3D Printing Lab Technician',
        companyName: 'OpenAI',
        priority: 'High',
        nextAction: 'Prepare portfolio examples',
        nextActionDueDate: new Date('2026-02-01'),
      }),
      makeJob({
        id: 'netflix',
        jobTitle: 'Product Manager, Sales Products',
        companyName: 'Netflix',
        priority: 'Low',
        workModel: 'Remote',
        nextAction: 'Follow up with recruiter',
        nextActionDueDate: new Date('2026-03-01'),
      })
    );
  });

  it('filters jobs by search text and priority', () => {
    render(<JobTrackerPage />);

    expect(screen.getByText('Robotics 3D Printing Lab Technician')).toBeInTheDocument();
    expect(screen.getByText('Product Manager, Sales Products')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search title, company, stage, action'), {
      target: { value: 'Netflix' },
    });

    expect(screen.queryByText('Robotics 3D Printing Lab Technician')).not.toBeInTheDocument();
    expect(screen.getByText('Product Manager, Sales Products')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('All priorities'), {
      target: { value: 'High' },
    });

    expect(screen.queryByText('Product Manager, Sales Products')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 0 of 2')).toBeInTheDocument();
  });

  it('opens the strategy view with filtered jobs', () => {
    render(<JobTrackerPage />);

    fireEvent.change(screen.getByDisplayValue('All priorities'), {
      target: { value: 'High' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Strategy' }));

    const strategy = screen.getByTestId('strategy-map');
    expect(within(strategy).getByText('Robotics 3D Printing Lab Technician')).toBeInTheDocument();
    expect(within(strategy).queryByText('Product Manager, Sales Products')).not.toBeInTheDocument();
  });
});
