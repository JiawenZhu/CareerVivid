import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import type { QuizQuestion } from '../../types/course';

interface QuizBlockProps {
  questions: QuizQuestion[];
  /** Minimum correct answers to pass (defaults to all). */
  minCorrect?: number;
  completed: boolean;
  onPass: () => void;
}

/**
 * Multiple-choice knowledge check with per-question feedback and explanations.
 * Calls `onPass` when the learner finishes with enough correct answers.
 */
const QuizBlock: React.FC<QuizBlockProps> = ({ questions, minCorrect, completed, onPass }) => {
  const required = minCorrect ?? questions.length;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempt, setAttempt] = useState(0);

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const finished = answeredCount === questions.length;
  const passed = finished && correctCount >= required;

  const choose = (question: QuizQuestion, optionIndex: number) => {
    if (answers[question.id] !== undefined) return;
    const next = { ...answers, [question.id]: optionIndex };
    setAnswers(next);
    const done = Object.keys(next).length === questions.length;
    const correct = questions.filter((q) => next[q.id] === q.correctIndex).length;
    if (done && correct >= required && !completed) onPass();
  };

  const retry = () => {
    setAnswers({});
    setAttempt((a) => a + 1);
  };

  return (
    <div key={attempt} className="grid gap-4">
      {questions.map((question, qIndex) => {
        const chosen = answers[question.id];
        const isAnswered = chosen !== undefined;
        return (
          <div key={question.id} className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
            <p className="flex items-start gap-2 text-sm font-bold text-[var(--cv-text-heading)]">
              <HelpCircle size={16} className="mt-0.5 shrink-0 text-[var(--cv-action-primary)]" />
              <span>
                <span className="mr-1 text-[var(--cv-text-muted)]">Q{qIndex + 1}.</span>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <span>{children}</span> }}>
                  {question.prompt}
                </ReactMarkdown>
              </span>
            </p>
            <div className="mt-3 grid gap-1.5">
              {question.options.map((option, optionIndex) => {
                const isChosen = chosen === optionIndex;
                const isCorrectOption = optionIndex === question.correctIndex;
                const showState = isAnswered && (isChosen || isCorrectOption);
                return (
                  <motion.button
                    key={option}
                    whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                    onClick={() => choose(question, optionIndex)}
                    disabled={isAnswered}
                    className={`flex items-start gap-2 rounded-xl border p-3 text-left text-[13px] font-medium transition-colors ${showState
                      ? isCorrectOption
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-[var(--cv-border-warm)] text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)] disabled:opacity-60'}`}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {showState ? (
                        isCorrectOption ? <CheckCircle2 size={15} /> : <XCircle size={15} />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-current opacity-40" />
                      )}
                    </span>
                    {option}
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {isAnswered && question.explanation && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 overflow-hidden rounded-lg bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3 text-xs font-medium leading-relaxed text-[var(--cv-text-body)]"
                >
                  {question.explanation}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {finished && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm font-bold ${passed
            ? 'border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}
        >
          <span>
            {correctCount}/{questions.length} correct — {passed ? 'quiz passed!' : `you need ${required} to pass.`}
          </span>
          {!passed && (
            <button onClick={retry} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-current px-3 text-xs font-bold">
              <RotateCcw size={13} /> Try again
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default QuizBlock;
