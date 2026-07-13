/**
 * Quest coding-stage test runner.
 *
 * Executes candidate code OFF the main thread and away from the app DOM:
 * - JavaScript runs directly in this worker (no DOM, no app globals).
 * - Python runs inside Pyodide (CPython compiled to WebAssembly), lazy-loaded
 *   from the jsDelivr CDN on first use.
 *
 * The host component enforces a wall-clock timeout and terminates the whole
 * worker on overrun, which is the only reliable defense against infinite
 * loops. The worker is stateless per message, so it can be recreated freely.
 */

export interface RunnerTest {
  input: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface RunnerRequest {
  id: number;
  language: 'javascript' | 'python';
  code: string;
  functionName: string;
  tests: RunnerTest[];
  /**
   * 'tests' (default): call `functionName` against `tests`.
   * 'script': run top-level code and just capture stdout — used by the
   * interactive lessons where the check is "did the output match".
   */
  mode?: 'tests' | 'script';
}

export interface RunnerTestOutcome {
  hidden: boolean;
  pass: boolean;
  input: string;
  expected: string;
  received: string;
  error?: string;
}

export interface RunnerResponse {
  id: number;
  ok: boolean;
  /** Fatal error (syntax error, missing function, runtime load failure). */
  error?: string;
  results: RunnerTestOutcome[];
  logs: string[];
  durationMs: number;
}

const PYODIDE_VERSION = 'v314.0.2'; // Pyodide now versions after CPython (3.14)
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.mjs`;
const MAX_CODE_LENGTH = 64_000;
const MAX_TEST_COUNT = 100;
const FUNCTION_NAME_PATTERN = /^[A-Za-z_$][\w$]*$/;

const stringify = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? 'undefined';
  } catch {
    return String(value);
  }
};

/** JSON-level deep equality — all challenge outputs are JSON-comparable. */
const deepEqual = (a: unknown, b: unknown): boolean => stringify(a) === stringify(b);

const assertRunnerRequest = (req: RunnerRequest): void => {
  if (!Number.isSafeInteger(req.id)) throw new Error('Invalid runner request.');
  if (typeof req.code !== 'string' || req.code.length > MAX_CODE_LENGTH) {
    throw new Error(`Code must be at most ${MAX_CODE_LENGTH.toLocaleString()} characters.`);
  }
  if (!FUNCTION_NAME_PATTERN.test(req.functionName)) {
    throw new Error('Invalid function name.');
  }
  if (!Array.isArray(req.tests) || req.tests.length > MAX_TEST_COUNT) {
    throw new Error(`A challenge can run at most ${MAX_TEST_COUNT} tests at once.`);
  }
};

// ---------------------------------------------------------------------------
// JavaScript runner
// ---------------------------------------------------------------------------

const runJavaScript = (req: RunnerRequest, logs: string[]): RunnerTestOutcome[] => {
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    if (logs.length < 200) logs.push(args.map((a) => (typeof a === 'string' ? a : stringify(a))).join(' '));
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function(
      `"use strict";\n${req.code}\n;return (typeof ${req.functionName} === 'function') ? ${req.functionName} : undefined;`,
    );
    const fn = factory() as ((...args: unknown[]) => unknown) | undefined;
    if (typeof fn !== 'function') {
      throw new Error(`Define a function named "${req.functionName}" — the tests call it directly.`);
    }

    return req.tests.map((test) => {
      try {
        const received = fn(...structuredClone(test.input));
        const pass = deepEqual(received, test.expected);
        return {
          hidden: !!test.hidden,
          pass,
          input: stringify(test.input),
          expected: stringify(test.expected),
          received: stringify(received),
        };
      } catch (err) {
        return {
          hidden: !!test.hidden,
          pass: false,
          input: stringify(test.input),
          expected: stringify(test.expected),
          received: 'error',
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });
  } finally {
    console.log = originalLog;
  }
};

/** Script mode: run top-level JS and capture console output; no function needed. */
const runJavaScriptScript = (req: RunnerRequest, logs: string[]): void => {
  const originalLog = console.log;
  const capture = (...args: unknown[]) => {
    if (logs.length < 200) logs.push(args.map((a) => (typeof a === 'string' ? a : stringify(a))).join(' '));
  };
  console.log = capture;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function('console', `"use strict";\n${req.code}\n`);
    factory({ log: capture, info: capture, warn: capture, error: capture });
  } finally {
    console.log = originalLog;
  }
};

// ---------------------------------------------------------------------------
// Python runner (Pyodide)
// ---------------------------------------------------------------------------

let pyodidePromise: Promise<any> | null = null;

/** Script mode: exec top-level Python and capture stdout; no function needed. */
const runPythonScript = async (req: RunnerRequest, logs: string[]): Promise<void> => {
  const pyodide = await getPyodide();
  pyodide.setStdout({ batched: (line: string) => { if (logs.length < 200) logs.push(line); } });
  pyodide.setStderr({ batched: (line: string) => { if (logs.length < 200) logs.push(line); } });

  const harness = [
    'import json',
    'def __cv_script(user_code):',
    '    try:',
    '        exec(user_code, {})',
    '        return json.dumps({"ok": True})',
    '    except Exception as e:',
    '        return json.dumps({"fatal": f"{type(e).__name__}: {e}"})',
  ].join('\n');

  pyodide.runPython(harness);
  const runFn = pyodide.globals.get('__cv_script');
  const raw = runFn(req.code);
  runFn.destroy?.();

  const parsed = JSON.parse(raw as string) as { ok?: boolean; fatal?: string };
  if (parsed.fatal) throw new Error(parsed.fatal);
};

const getPyodide = (): Promise<any> => {
  if (!pyodidePromise) {
    pyodidePromise = import(/* @vite-ignore */ PYODIDE_URL).then((mod) =>
      mod.loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/` }),
    );
  }
  return pyodidePromise;
};

const runPython = async (req: RunnerRequest, logs: string[]): Promise<RunnerTestOutcome[]> => {
  const pyodide = await getPyodide();

  pyodide.setStdout({
    batched: (line: string) => {
      if (logs.length < 200) logs.push(line);
    },
  });
  pyodide.setStderr({
    batched: (line: string) => {
      if (logs.length < 200) logs.push(line);
    },
  });

  const harness = [
    'import json',
    'def __cv_run(user_code, fn_name, tests_json):',
    '    scope = {}',
    '    try:',
    '        exec(user_code, scope)',
    '    except Exception as e:',
    '        return json.dumps({"fatal": f"{type(e).__name__}: {e}"})',
    '    fn = scope.get(fn_name)',
    '    if not callable(fn):',
    '        return json.dumps({"fatal": f"Define a function named \\"{fn_name}\\" - the tests call it directly."})',
    '    out = []',
    '    for t in json.loads(tests_json):',
    '        try:',
    '            r = fn(*t["input"])',
    '            out.append({"received": r})',
    '        except Exception as e:',
    '            out.append({"error": f"{type(e).__name__}: {e}"})',
    '    try:',
    '        return json.dumps({"results": out})',
    '    except TypeError:',
    '        safe = []',
    '        for r in out:',
    '            if "received" in r:',
    '                safe.append({"received": repr(r["received"]), "unserializable": True})',
    '            else:',
    '                safe.append(r)',
    '        return json.dumps({"results": safe})',
  ].join('\n');

  pyodide.runPython(harness);
  const runFn = pyodide.globals.get('__cv_run');
  const raw = runFn(req.code, req.functionName, JSON.stringify(req.tests.map((t) => ({ input: t.input }))));
  runFn.destroy?.();

  const parsed = JSON.parse(raw as string) as {
    fatal?: string;
    results?: Array<{ received?: unknown; error?: string; unserializable?: boolean }>;
  };
  if (parsed.fatal) throw new Error(parsed.fatal);

  return (parsed.results ?? []).map((r, i) => {
    const test = req.tests[i];
    if (r.error || r.unserializable) {
      return {
        hidden: !!test.hidden,
        pass: false,
        input: stringify(test.input),
        expected: stringify(test.expected),
        received: r.unserializable ? String(r.received) : 'error',
        error: r.error ?? 'Return value is not JSON-serializable (return lists/numbers/strings/bools).',
      };
    }
    // Python tuples arrive as JSON arrays; True/False as booleans — JSON-level
    // comparison matches the challenge contract.
    const pass = deepEqual(r.received, test.expected);
    return {
      hidden: !!test.hidden,
      pass,
      input: stringify(test.input),
      expected: stringify(test.expected),
      received: stringify(r.received),
    };
  });
};

// ---------------------------------------------------------------------------
// Message loop
// ---------------------------------------------------------------------------

self.onmessage = async (event: MessageEvent<RunnerRequest>) => {
  const req = event.data;
  const logs: string[] = [];
  const started = performance.now();

  try {
    assertRunnerRequest(req);
    let results: RunnerTestOutcome[];
    if (req.mode === 'script') {
      if (req.language === 'python') await runPythonScript(req, logs);
      else runJavaScriptScript(req, logs);
      results = [];
    } else {
      results = req.language === 'python' ? await runPython(req, logs) : runJavaScript(req, logs);
    }
    const response: RunnerResponse = {
      id: req.id,
      ok: true,
      results,
      logs,
      durationMs: Math.round(performance.now() - started),
    };
    self.postMessage(response);
  } catch (err) {
    const response: RunnerResponse = {
      id: req.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      results: [],
      logs,
      durationMs: Math.round(performance.now() - started),
    };
    self.postMessage(response);
  }
};
