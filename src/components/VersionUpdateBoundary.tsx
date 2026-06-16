import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const VERSION_RECOVERY_EVENT = 'careervivid:version-recovery';
const VERSION_RECOVERY_RELOAD_KEY = 'careervivid:version-recovery:last-reload-at';
const VERSION_RECOVERY_COOLDOWN_MS = 15_000;

type VersionRecoveryDetail = {
  reason: string;
};

const chunkErrorPatterns = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Unable to preload CSS/i,
  /Strict MIME type checking/i,
  /Expected a JavaScript-or-Wasm module script/i,
  /dynamically imported module/i,
];

const getErrorText = (error: unknown): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return `${error.name} ${error.message} ${error.stack || ''}`;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const isVersionedAssetUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return /\/assets\/.+\.(?:js|css)$/.test(url) || /\/_next\/static\/.+\.(?:js|css)$/.test(url);
};

export const isVersionMismatchError = (error: unknown) => {
  const errorText = getErrorText(error);
  return chunkErrorPatterns.some((pattern) => pattern.test(errorText));
};

const dispatchRecoveryEvent = (reason: string) => {
  window.dispatchEvent(
    new CustomEvent<VersionRecoveryDetail>(VERSION_RECOVERY_EVENT, {
      detail: { reason },
    })
  );
};

const clearBrowserRuntimeCaches = async () => {
  if (!('caches' in window)) return;

  const cacheNames = await window.caches.keys();
  await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
};

const updateWaitingServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;

  await registration.update();
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
};

export const requestVersionRecovery = async (reason: string) => {
  if (typeof window === 'undefined') return;

  dispatchRecoveryEvent(reason);

  const now = Date.now();
  const lastReloadAt = Number(window.sessionStorage.getItem(VERSION_RECOVERY_RELOAD_KEY) || '0');
  if (Number.isFinite(lastReloadAt) && now - lastReloadAt < VERSION_RECOVERY_COOLDOWN_MS) {
    return;
  }

  window.sessionStorage.setItem(VERSION_RECOVERY_RELOAD_KEY, String(now));

  try {
    await Promise.allSettled([
      clearBrowserRuntimeCaches(),
      updateWaitingServiceWorker(),
    ]);
  } finally {
    window.setTimeout(() => {
      window.location.reload();
    }, 350);
  }
};

const useVersionUpdateRecovery = () => {
  const [recoveryReason, setRecoveryReason] = useState<string | null>(null);

  useEffect(() => {
    const handleRecoveryEvent = (event: Event) => {
      const customEvent = event as CustomEvent<VersionRecoveryDetail>;
      setRecoveryReason(customEvent.detail?.reason || 'version-mismatch');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isVersionMismatchError(event.reason)) return;

      event.preventDefault();
      void requestVersionRecovery('dynamic-import');
    };

    const handlePreloadError = (event: Event) => {
      event.preventDefault();
      void requestVersionRecovery('vite-preload');
    };

    const handleResourceError = (event: ErrorEvent | Event) => {
      const target = event.target as HTMLScriptElement | HTMLLinkElement | null;
      const assetUrl = target && 'src' in target ? target.src : target && 'href' in target ? target.href : null;

      if (isVersionedAssetUrl(assetUrl)) {
        void requestVersionRecovery('asset-load');
        return;
      }

      if ('error' in event && isVersionMismatchError(event.error || event.message)) {
        void requestVersionRecovery('runtime-error');
      }
    };

    window.addEventListener(VERSION_RECOVERY_EVENT, handleRecoveryEvent);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('vite:preloadError', handlePreloadError);
    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener(VERSION_RECOVERY_EVENT, handleRecoveryEvent);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('vite:preloadError', handlePreloadError);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  return recoveryReason;
};

class RuntimeVersionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { fatalError: unknown; versionError: boolean }
> {
  state = { fatalError: null, versionError: false };

  static getDerivedStateFromError(error: unknown) {
    return {
      fatalError: error,
      versionError: isVersionMismatchError(error),
    };
  }

  componentDidCatch(error: unknown) {
    if (isVersionMismatchError(error)) {
      void requestVersionRecovery('react-boundary');
    }
  }

  render() {
    if (this.state.versionError) {
      return <VersionRecoveryOverlay />;
    }

    if (this.state.fatalError) {
      throw this.state.fatalError;
    }

    return this.props.children;
  }
}

const VersionRecoveryOverlay = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f1115] text-white">
    <div className="mx-6 max-w-sm rounded-2xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur">
      <RefreshCw className="mx-auto h-9 w-9 animate-spin text-primary-300" />
      <h1 className="mt-4 text-xl font-bold">Updating CareerVivid</h1>
      <p className="mt-2 text-sm leading-6 text-white/75">
        A new version is ready. Refreshing the workspace now so this session can continue.
      </p>
    </div>
  </div>
);

const VersionRecoveryToast = ({ reason }: { reason: string }) => (
  <div className="fixed bottom-6 left-1/2 z-[9999] w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-gray-950 px-5 py-4 text-white shadow-2xl">
    <div className="flex items-center gap-3">
      <RefreshCw className="h-5 w-5 animate-spin text-primary-300" />
      <div>
        <p className="text-sm font-semibold">Refreshing to the newest version</p>
        <p className="mt-1 text-xs text-white/65">Recovered from {reason.replace(/-/g, ' ')}.</p>
      </div>
    </div>
  </div>
);

const VersionUpdateBoundary = ({ children }: { children: React.ReactNode }) => {
  const recoveryReason = useVersionUpdateRecovery();

  return (
    <RuntimeVersionErrorBoundary>
      {children}
      {recoveryReason && <VersionRecoveryToast reason={recoveryReason} />}
    </RuntimeVersionErrorBoundary>
  );
};

export default VersionUpdateBoundary;
