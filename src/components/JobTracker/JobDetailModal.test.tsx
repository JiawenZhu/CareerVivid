import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JobDetailModal from './JobDetailModal';
import { JobApplicationData, ResumeData } from '../../types';

const { mockCheckCredit, mockNavigate } = vi.hoisted(() => ({
  mockCheckCredit: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const copy: Record<string, string> = {
        'common.close': 'Close',
        'common.cancel': 'Cancel',
        'job_tracker.modal.delete_btn': 'Delete',
        'job_tracker.modal.delete_title': 'Delete Job',
        'job_tracker.modal.delete_confirm': 'Delete this tracked job?',
        'job_tracker.modal.job_title': 'Job Title',
        'job_tracker.modal.company': 'Company',
        'job_tracker.modal.location': 'Location',
        'job_tracker.modal.salary_range': 'Salary Range',
        'job_tracker.modal.work_model': 'Work Model',
        'job_tracker.modal.interview_stage': 'Interview Stage',
        'job_tracker.modal.date_applied': 'Date Applied',
        'job_tracker.modal.job_post_url': 'Job Post URL',
        'job_tracker.modal.direct_app_url': 'Direct Application URL',
        'job_tracker.modal.resume_match': 'Resume Match',
        'job_tracker.modal.compare_resume': 'Compare with resume',
        'job_tracker.modal.analyze_match': 'Analyze Match',
        'job_tracker.modal.analyzing': 'Analyzing',
        'job_tracker.modal.optimize_resume': 'Optimize Resume',
        'job_tracker.modal.job_description': 'Job Description',
        'job_tracker.modal.generate_prep': 'Generate All Prep Notes with AI',
        'job_tracker.modal.generating': 'Generating',
        'job_tracker.modal.matched_keywords': 'Matched Keywords',
        'job_tracker.modal.missing_keywords': 'Missing Keywords',
        'job_tracker.modal.prep_sections.role_research': 'Company & Role Research',
        'job_tracker.modal.prep_sections.role_research_ph': 'Role notes placeholder',
        'job_tracker.modal.prep_sections.my_story': 'My Story & Pitch',
        'job_tracker.modal.prep_sections.my_story_ph': 'Story placeholder',
        'job_tracker.modal.prep_sections.interview_prep': 'Interview Prep Q&A',
        'job_tracker.modal.prep_sections.interview_prep_ph': 'Interview placeholder',
        'job_tracker.modal.prep_sections.questions_for_them': 'Questions for Them',
        'job_tracker.modal.prep_sections.questions_for_them_ph': 'Questions placeholder',
        'job_tracker.modal.prep_sections.general_notes': 'General Notes',
        'job_tracker.modal.prep_sections.general_notes_ph': 'Notes placeholder',
      };
      return copy[key] || key;
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-1', email: 'user@example.com' } }),
}));

const resume: ResumeData = {
  id: 'resume-1',
  title: 'Software Engineer Resume',
  updatedAt: '2026-01-01',
  templateId: 'Modern',
  personalDetails: {
    jobTitle: 'Software Engineer',
    photo: '',
    firstName: 'Evan',
    lastName: 'Lee',
    email: 'evan@example.com',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  },
  professionalSummary: 'Builder',
  websites: [],
  skills: [{ id: 'skill-1', name: 'React', level: 'Expert' }],
  employmentHistory: [],
  education: [],
  languages: [],
  themeColor: '#111827',
  titleFont: 'Montserrat',
  bodyFont: 'Lato',
  language: 'English',
};

vi.mock('../../hooks/useResumes', () => ({
  useResumes: () => ({ resumes: [resume] }),
}));

vi.mock('../../hooks/useAICreditCheck', () => ({
  useAICreditCheck: () => ({
    checkCredit: mockCheckCredit,
    CreditLimitModal: () => null,
  }),
}));

vi.mock('../../services/geminiService', () => ({
  generateJobPrepNotes: vi.fn(),
  regenerateJobPrepSection: vi.fn(),
  analyzeResumeMatch: vi.fn(),
}));

vi.mock('../../utils/navigation', () => ({
  navigate: mockNavigate,
}));

const makeJob = (overrides: Partial<JobApplicationData> = {}): JobApplicationData => ({
  id: 'job-1',
  userId: 'user-1',
  jobTitle: 'Robotics 3D Printing Lab Technician',
  companyName: 'OpenAI',
  jobPostURL: 'https://example.com/job',
  applicationStatus: 'To Apply',
  workModel: 'On-site',
  interviewStage: 'Recruiter Screen',
  location: 'San Francisco, CA',
  salaryRange: '$180K - $220K',
  jobDescription: 'Maintain additive manufacturing equipment.',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  ...overrides,
});

describe('JobDetailModal split dashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockCheckCredit.mockReturnValue(true);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: vi.fn(() => []),
        cancel: vi.fn(),
        speak: vi.fn(),
        speaking: false,
        onvoiceschanged: null,
      },
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders legacy jobs with default priority and switches to prep tab', () => {
    render(<JobDetailModal job={makeJob({ priority: undefined })} onClose={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    expect(screen.getByText('Job Description')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Prep' }));

    expect(screen.getByText('Company & Role Research')).toBeInTheDocument();
    expect(screen.getByText('My Story & Pitch')).toBeInTheDocument();
  });

  it('autosaves new tracking fields from the right rail', async () => {
    const onUpdate = vi.fn();
    render(<JobDetailModal job={makeJob()} onClose={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue('Medium'), { target: { value: 'High' } });
    fireEvent.change(screen.getByDisplayValue('No action'), {
      target: { value: 'Send thank-you note' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., Jane Smith'), {
      target: { value: 'Jordan Recruiter' },
    });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(onUpdate).toHaveBeenCalled();
    expect(onUpdate.mock.calls.at(-1)?.[1]).toMatchObject({
      priority: 'High',
      nextAction: 'Send thank-you note',
      contactName: 'Jordan Recruiter',
    });
  });

  it('confirms delete before removing the job', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(<JobDetailModal job={makeJob()} onClose={onClose} onUpdate={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByTitle('Delete'));
    expect(screen.getByText('Delete Job')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);

    expect(onDelete).toHaveBeenCalledWith('job-1');
    expect(onClose).toHaveBeenCalled();
  });
});
