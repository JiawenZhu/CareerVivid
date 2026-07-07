import { useCallback, useEffect, useRef } from 'react';
import type { RunnerRequest, RunnerResponse, RunnerTest } from '../workers/questCodeRunner.worker';
import type { ExecutableCodingLanguage } from '../lib/codingChallenges';

export interface RunOptions {
  language: ExecutableCodingLanguage;
  code: string;
  /** 'tests' (default) calls functionName; 'script' just runs code + captures stdout. */
  mode?: 'tests' | 'script';
  functionName?: string;
  tests?: RunnerTest[];
  /** Wall-clock budget; worker is terminated on overrun. */
  timeoutMs: number;
}

/**
 * Owns the quest code-runner Web Worker. Enforces the wall-clock timeout by
 * terminating the worker (the only reliable way to stop an infinite loop) and
 * transparently recreates it for the next run.
 */
export const useQuestCodeRunner = () => {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const spawn = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/questCodeRunner.worker.ts', import.meta.url),
        { type: 'module' },
      );
    }
    return workerRef.current;
  }, []);

  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const run = useCallback((options: RunOptions): Promise<RunnerResponse> => {
    const worker = spawn();
    const id = ++requestIdRef.current;

    return new Promise<RunnerResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        workerRef.current?.terminate();
        workerRef.current = null; // recreated lazily on next run
        reject(new Error(
          options.language === 'python'
            ? 'Execution timed out. If this was the first Python run it may just be the runtime downloading — try again. Otherwise check for infinite loops.'
            : 'Execution timed out — check for infinite loops.',
        ));
      }, options.timeoutMs);

      const onMessage = (event: MessageEvent<RunnerResponse>) => {
        if (event.data?.id !== id) return;
        cleanup();
        resolve(event.data);
      };
      const onError = (event: ErrorEvent) => {
        cleanup();
        reject(new Error(event.message || 'Code runner crashed.'));
      };
      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);

      const request: RunnerRequest = {
        id,
        language: options.language,
        code: options.code,
        mode: options.mode ?? 'tests',
        functionName: options.functionName ?? '',
        tests: options.tests ?? [],
      };
      worker.postMessage(request);
    });
  }, [spawn]);

  return { run };
};
