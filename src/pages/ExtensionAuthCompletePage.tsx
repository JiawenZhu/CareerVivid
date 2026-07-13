import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCcw, ShieldCheck, XCircle } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  createExtensionAuthPayload,
  syncAuthWithExtension,
  type ExtensionAuthSyncResult,
} from '../utils/extensionAuthBridge';
import { toSafeInternalPath } from '../utils/safeUrl';

type SyncStatus = 'syncing' | 'success' | 'failed';

const ExtensionAuthCompletePage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('syncing');
  const [results, setResults] = useState<ExtensionAuthSyncResult[]>([]);

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return toSafeInternalPath(params.get('return_to'), '/extension-welcome');
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      const redirect = encodeURIComponent('/extension-auth-complete');
      window.location.replace(`/signin?redirect=${redirect}`);
      return;
    }

    let cancelled = false;

    const runSync = async () => {
      setStatus('syncing');

      try {
        const payload = await createExtensionAuthPayload(
          currentUser,
          auth.app.options.apiKey || null,
          true
        );
        const syncResults = await syncAuthWithExtension(payload, {
          attempts: 6,
          retryDelayMs: 900,
        });

        if (cancelled) return;

        setResults(syncResults);
        setStatus(syncResults.some((result) => result.ok) ? 'success' : 'failed');
      } catch (err: any) {
        if (cancelled) return;
        setResults([{
          extensionId: 'web_app',
          ok: false,
          error: err?.message || 'Unable to sync extension authentication.',
        }]);
        setStatus('failed');
      }
    };

    runSync();

    return () => {
      cancelled = true;
    };
  }, [currentUser, loading]);

  const retrySync = async () => {
    if (!currentUser) return;

    setStatus('syncing');
    setResults([]);

    try {
      const payload = await createExtensionAuthPayload(
        currentUser,
        auth.app.options.apiKey || null,
        true
      );
      const syncResults = await syncAuthWithExtension(payload, {
        attempts: 6,
        retryDelayMs: 900,
      });
      setResults(syncResults);
      setStatus(syncResults.some((result) => result.ok) ? 'success' : 'failed');
    } catch (err: any) {
      setResults([{
        extensionId: 'web_app',
        ok: false,
        error: err?.message || 'Unable to sync extension authentication.',
      }]);
      setStatus('failed');
    }
  };

  const openDashboard = () => {
    window.location.assign(nextUrl);
  };

  const hasExtensionError = results.length > 0 && !results.some((result) => result.ok);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/60">
        <div className="flex items-center justify-center">
          <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
            status === 'success' ? 'bg-emerald-50 text-emerald-600' :
            status === 'failed' ? 'bg-red-50 text-red-600' :
            'bg-indigo-50 text-indigo-600'
          }`}>
            {status === 'success' && <CheckCircle2 size={30} />}
            {status === 'failed' && <XCircle size={30} />}
            {status === 'syncing' && <Loader2 size={30} className="animate-spin" />}
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {status === 'success' ? 'Extension Connected' : status === 'failed' ? 'Extension Not Connected' : 'Connecting Extension'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {status === 'success'
              ? 'CareerVivid is ready on job application pages.'
              : status === 'failed'
                ? 'Chrome did not confirm the extension auth handshake.'
                : 'Keep this tab open while CareerVivid confirms your extension session.'}
          </p>
        </div>

        {hasExtensionError && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-900">
            <div className="font-semibold">Last handshake result</div>
            <div className="mt-1 break-words">
              {results.map((result) => `${result.extensionId}: ${result.error || 'no acknowledgement'}`).join(' | ')}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3">
          {status === 'success' ? (
            <button
              type="button"
              onClick={openDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-bold text-white hover:bg-black"
            >
              <ShieldCheck size={18} />
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={retrySync}
              disabled={status === 'syncing'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-bold text-white hover:bg-black disabled:cursor-wait disabled:opacity-70"
            >
              {status === 'syncing' ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
              {status === 'syncing' ? 'Connecting' : 'Try Again'}
            </button>
          )}
          <button
            type="button"
            onClick={openDashboard}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Open Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionAuthCompletePage;
