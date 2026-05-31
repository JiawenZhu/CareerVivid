import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeedbackModal from './FeedbackModal';

const { mockAddDoc } = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-1', email: 'user@example.com' } }),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'feedback-collection'),
  addDoc: mockAddDoc,
  serverTimestamp: vi.fn(() => 'server-time'),
}));

describe('FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'feedback-1' });
  });

  it('requires a rating before sending feedback', () => {
    render(<FeedbackModal isOpen onClose={vi.fn()} source="interview" />);

    fireEvent.click(screen.getByRole('button', { name: /send feedback/i }));

    expect(screen.getByText('Please select a rating before sending.')).toBeInTheDocument();
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('submits source-aware feedback after rating selection', async () => {
    const onSubmitted = vi.fn();
    render(<FeedbackModal isOpen onClose={vi.fn()} onSubmitted={onSubmitted} source="interview" context={{ analysisId: 'analysis-1' }} />);

    expect(screen.getByText('Rate this report')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 out of 5' }));
    fireEvent.change(screen.getByPlaceholderText('Share what was helpful or what was missing. (optional)'), {
      target: { value: 'Helpful coaching summary.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send feedback/i }));

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    expect(mockAddDoc.mock.calls[0][1]).toMatchObject({
      userId: 'user-1',
      rating: 4,
      comment: 'Helpful coaching summary.',
      source: 'interview',
      context: { analysisId: 'analysis-1' },
    });
    expect(onSubmitted).toHaveBeenCalled();
  });
});
