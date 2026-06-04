import { useEffect, useState } from 'react';

type RunnerStatus = {
  state: 'idle' | 'running' | 'stopped' | 'error';
  lastError?: string;
  appUrl: string;
};

declare global {
  interface Window {
    autoApplyRunner: {
      getStatus: () => Promise<RunnerStatus>;
      openCareerVivid: () => Promise<{ success: boolean; error?: string }>;
      start: () => Promise<{ success: boolean; error?: string }>;
      stop: () => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export default function App() {
  const [status, setStatus] = useState<RunnerStatus>({ state: 'idle', appUrl: 'https://careervivid.app/' });
  const [isBusy, setIsBusy] = useState(false);

  const refresh = async () => {
    setStatus(await window.autoApplyRunner.getStatus());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const runAction = async (action: 'openCareerVivid' | 'start' | 'stop') => {
    setIsBusy(true);
    try {
      await window.autoApplyRunner[action]();
      await refresh();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">CareerVivid Apply Agent</p>
          <h1>Desktop runner</h1>
          <p className="copy">
            Keep CareerVivid as the source of truth, then run ATS automation from a local Playwright browser context.
          </p>
        </div>
        <div className={`status ${status.state}`}>
          <span>{status.state}</span>
        </div>
      </section>

      <section className="panel">
        <div className="row">
          <div>
            <h2>Runner browser</h2>
            <p>Sign into CareerVivid and job boards once in the Playwright browser. The runner keeps that local session.</p>
          </div>
          <button type="button" disabled={isBusy} onClick={() => runAction('openCareerVivid')}>
            Open CareerVivid
          </button>
        </div>
        <div className="row">
          <div>
            <h2>Overnight mode</h2>
            <p>Claim approved queue items, open apply URLs, fill known fields, and stop for sensitive or uncertain steps.</p>
          </div>
          <div className="actions">
            <button type="button" disabled={isBusy || status.state === 'running'} onClick={() => runAction('start')}>
              Start
            </button>
            <button type="button" disabled={isBusy || status.state !== 'running'} onClick={() => runAction('stop')}>
              Stop
            </button>
          </div>
        </div>
      </section>

      {status.lastError && <p className="error">{status.lastError}</p>}
    </main>
  );
}
