import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIInterviewAgentModal from './AIInterviewAgentModal';

const { mockPrewarmCallable } = vi.hoisted(() => ({
  mockPrewarmCallable: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({ app: 'firebase-functions' })),
  httpsCallable: vi.fn(() => mockPrewarmCallable),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-1', email: 'user@example.com' } }),
}));

vi.mock('../hooks/useJobHistory', () => ({
  usePracticeHistory: () => ({
    addAnalysisToJob: vi.fn(),
  }),
}));

vi.mock('../services/geminiService', () => ({
  analyzeInterviewTranscript: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  Modality: { AUDIO: 'AUDIO' },
}));

const renderModal = () =>
  render(
    <AIInterviewAgentModal
      jobId="practice-1"
      interviewPrompt="Scheduled practice session for database migration"
      questions={['How would you migrate a database with zero downtime?']}
      isFirstTime={false}
      resumeContext=""
      jobTitle="Backend Engineer"
      jobCompany="Scheduled Practice"
      onClose={vi.fn()}
    />,
  );

describe('AIInterviewAgentModal prewarm', () => {
  beforeEach(() => {
    mockPrewarmCallable.mockReset();
  });

  it('warms the interview agent on open without blocking start', async () => {
    let resolvePrewarm!: (value: unknown) => void;
    mockPrewarmCallable.mockReturnValue(
      new Promise((resolve) => {
        resolvePrewarm = resolve;
      }),
    );

    renderModal();

    await waitFor(() => {
      expect(mockPrewarmCallable).toHaveBeenCalledWith({ role: 'Backend Engineer', prewarm: true });
    });

    expect(screen.getByText('Warming up')).toBeInTheDocument();
    expect(screen.getByText('The live agent is warming in the background. You can start anytime.')).toBeInTheDocument();
    expect(screen.getByText('Agent warming in background')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start interview/i })).toBeEnabled();

    await act(async () => {
      resolvePrewarm({ data: { prewarmed: true } });
    });

    await waitFor(() => {
      expect(screen.getByText('Agent is warmed up. Start when you are ready.')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /start interview/i })).toBeEnabled();
  });
});
