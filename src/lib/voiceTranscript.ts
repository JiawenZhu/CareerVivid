import type { TranscriptEntry } from '../types';

export interface CoachTranscriptTurn {
    role: 'user' | 'coach';
    text: string;
}

/** Convert the ordered coach conversation into the report transcript format. */
export const toTranscriptEntries = (history: readonly CoachTranscriptTurn[]): TranscriptEntry[] =>
    history.map((turn) => ({
        speaker: turn.role === 'coach' ? 'ai' : 'user',
        text: turn.text,
        isFinal: true,
    }));
