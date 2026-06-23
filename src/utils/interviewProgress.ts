import type { TranscriptEntry } from '../types';

export type QuestionFlowState = 'covered' | 'current' | 'queued';

export const getFinalTranscriptTurns = (transcript: TranscriptEntry[], speaker?: TranscriptEntry['speaker']) =>
  transcript.filter(entry => entry.isFinal && (!speaker || entry.speaker === speaker));

export const normalizeQuestionText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[''"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const transcriptTurnIncludesQuestion = (turnText: string, question: string) => {
  const normalizedTurn = normalizeQuestionText(turnText);
  const normalizedQuestion = normalizeQuestionText(question);
  if (!normalizedQuestion) return false;
  if (normalizedTurn.includes(normalizedQuestion)) return true;

  const words = normalizedQuestion.split(' ').filter(word => word.length > 2);
  if (words.length < 5) return false;

  const leadingPhrase = words.slice(0, Math.min(words.length, 8)).join(' ');
  return normalizedTurn.includes(leadingPhrase);
};

export const getQuestionFlowStates = (questions: string[], transcript: TranscriptEntry[]): QuestionFlowState[] => {
  const finalTurns = getFinalTranscriptTurns(transcript);
  const askedTurnIndexes = new Map<number, number>();
  let searchStart = 0;

  questions.forEach((question, questionIndex) => {
    const askedTurnIndex = finalTurns.findIndex((entry, turnIndex) =>
      turnIndex >= searchStart &&
      entry.speaker === 'ai' &&
      transcriptTurnIncludesQuestion(entry.text, question),
    );

    if (askedTurnIndex >= 0) {
      askedTurnIndexes.set(questionIndex, askedTurnIndex);
      searchStart = askedTurnIndex + 1;
    }
  });

  return questions.map((_, questionIndex) => {
    const askedTurnIndex = askedTurnIndexes.get(questionIndex);
    if (askedTurnIndex === undefined) return 'queued';

    const nextAskedTurnIndex = askedTurnIndexes.get(questionIndex + 1);
    const hasAnswerAfterQuestion = finalTurns.some((entry, turnIndex) =>
      entry.speaker === 'user' &&
      turnIndex > askedTurnIndex &&
      (nextAskedTurnIndex === undefined || turnIndex < nextAskedTurnIndex),
    );

    if (hasAnswerAfterQuestion || nextAskedTurnIndex !== undefined) return 'covered';
    return 'current';
  });
};

export const getNextQuestionIndex = (questions: string[], transcript: TranscriptEntry[]) =>
  getQuestionFlowStates(questions, transcript).filter(state => state === 'covered').length;

