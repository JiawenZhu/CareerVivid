import { describe, expect, it } from 'vitest';
import { toTranscriptEntries } from './voiceTranscript';

describe('toTranscriptEntries', () => {
    it('preserves the ordered user and coach turns for interview reports', () => {
        expect(toTranscriptEntries([
            { role: 'user', text: 'I would use a deque here.' },
            { role: 'coach', text: 'How does it handle duplicate values?' },
        ])).toEqual([
            { speaker: 'user', text: 'I would use a deque here.', isFinal: true },
            { speaker: 'ai', text: 'How does it handle duplicate values?', isFinal: true },
        ]);
    });
});
