import type { User } from 'firebase/auth';

export type ExtensionAuthPayload = {
  token: string;
  uid: string;
  refreshToken?: string | null;
  expirationTime?: number | null;
  apiKey?: string | null;
  email?: string | null;
};

export type ExtensionAuthSyncResult = {
  extensionId: string;
  ok: boolean;
  response?: unknown;
  error?: string;
};

const DEFAULT_EXTENSION_IDS = [
  'lmpgqdmlkjipeoagilaebklidjngdgjg',
  'lmpgodmlkjipeoagilaebklidjngdgjg',
];

const getExtensionIds = (): string[] => {
  const configuredIds = (import.meta.env.VITE_CAREERVIVID_EXTENSION_IDS || '')
    .split(',')
    .map((id: string) => id.trim())
    .filter(Boolean);

  const allowedIds = Array.from(new Set([...configuredIds, ...DEFAULT_EXTENSION_IDS]));
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('extension_id')?.trim();

  return Array.from(new Set([
    ...(requestedId && allowedIds.includes(requestedId) ? [requestedId] : []),
    ...allowedIds,
  ]));
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const getChromeRuntime = (): any | null => {
  if (typeof window === 'undefined') return null;
  const chrome = (window as any).chrome;
  if (!chrome?.runtime?.sendMessage) return null;
  return chrome.runtime;
};

const parseJwtExpiration = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  } catch (_) {
    return null;
  }
};

export const createExtensionAuthPayload = async (
  user: User,
  apiKey?: string | null,
  forceRefresh = false
): Promise<ExtensionAuthPayload> => {
  const token = await user.getIdToken(forceRefresh);
  const refreshToken = user.refreshToken || (user as any).stsTokenManager?.refreshToken || null;

  return {
    token,
    uid: user.uid,
    refreshToken,
    expirationTime: parseJwtExpiration(token) || (user as any).stsTokenManager?.expirationTime || null,
    apiKey: apiKey || null,
    email: user.email || null,
  };
};

const sendExternalMessage = (
  runtime: any,
  extensionId: string,
  message: Record<string, unknown>
): Promise<ExtensionAuthSyncResult> => {
  return new Promise((resolve) => {
    try {
      runtime.sendMessage(extensionId, message, (response: unknown) => {
        const lastError = runtime.lastError;
        if (lastError) {
          resolve({
            extensionId,
            ok: false,
            error: lastError.message || 'Extension did not acknowledge auth message.',
          });
          return;
        }

        resolve({
          extensionId,
          ok: (response as any)?.success === true,
          response,
        });
      });
    } catch (err: any) {
      resolve({
        extensionId,
        ok: false,
        error: err?.message || 'Failed to send auth message to extension.',
      });
    }
  });
};

export const syncAuthWithExtension = async (
  payload: ExtensionAuthPayload | null,
  options: { attempts?: number; retryDelayMs?: number } = {}
): Promise<ExtensionAuthSyncResult[]> => {
  const runtime = getChromeRuntime();
  if (!runtime) {
    return [{
      extensionId: 'chrome.runtime',
      ok: false,
      error: 'Chrome extension messaging is unavailable in this browser context.',
    }];
  }

  const attempts = options.attempts ?? 4;
  const retryDelayMs = options.retryDelayMs ?? 750;
  const ids = getExtensionIds();
  let latestResults: ExtensionAuthSyncResult[] = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const message = payload
      ? {
          type: 'AUTH_SUCCESS',
          handshakeVersion: 2,
          source: 'careervivid_web_app',
          sentAt: new Date().toISOString(),
          ...payload,
        }
      : {
          type: 'CLEAR_AUTH_TOKEN',
          handshakeVersion: 2,
          source: 'careervivid_web_app',
          sentAt: new Date().toISOString(),
        };

    latestResults = await Promise.all(
      ids.map((id) => sendExternalMessage(runtime, id, message))
    );

    if (latestResults.some((result) => result.ok)) {
      return latestResults;
    }

    if (attempt < attempts - 1) {
      await delay(retryDelayMs);
    }
  }

  return latestResults;
};
