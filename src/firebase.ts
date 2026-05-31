import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

type ViteEnvValue = string | boolean | undefined;

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, ViteEnvValue> }).env ?? {};

const getProcessEnv = (key: string): string | undefined => (
    typeof process !== 'undefined' ? process.env[key] : undefined
);

const getViteString = (key: string): string | undefined => {
    const value = viteEnv[key];
    return typeof value === 'string' ? value : undefined;
};

const getClientEnv = (viteKey: string, nextKey: string) => {
    const value = getViteString(viteKey)?.trim() ||
        getProcessEnv(viteKey)?.trim() ||
        getProcessEnv(nextKey)?.trim() ||
        '';
    return value;
};

const getClientEnvFlag = (viteKey: string, nextKey: string) => (
    viteEnv[viteKey] === true ||
    viteEnv[viteKey] === 'true' ||
    getProcessEnv(viteKey) === 'true' ||
    getProcessEnv(nextKey) === 'true'
);

const firebaseConfig = {
    apiKey: getClientEnv('VITE_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getClientEnv('VITE_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    databaseURL: getClientEnv('VITE_FIREBASE_DATABASE_URL', 'NEXT_PUBLIC_FIREBASE_DATABASE_URL'),
    projectId: getClientEnv('VITE_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getClientEnv('VITE_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getClientEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getClientEnv('VITE_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
    measurementId: getClientEnv('VITE_FIREBASE_MEASUREMENT_ID', 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID')
};

const requiredFirebaseConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const missingFirebaseConfigKeys = requiredFirebaseConfigKeys.filter((key) => !firebaseConfig[key]);

if (missingFirebaseConfigKeys.length > 0) {
    throw new Error(`[Firebase] Missing required client config: ${missingFirebaseConfigKeys.join(', ')}. Check VITE_FIREBASE_* env values.`);
}

const app = initializeApp(firebaseConfig);

// Safely initialize analytics - bypass in extension environment to avoid CSP/Cookie/IndexedDB exceptions
const isExtensionBuild = getClientEnvFlag('VITE_EXTENSION_BUILD', 'NEXT_PUBLIC_EXTENSION_BUILD');

const isExtension = typeof window !== 'undefined' && 
    (window.location.protocol === 'chrome-extension:' || 
     (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id));

const analytics = (!isExtensionBuild && !isExtension && typeof window !== 'undefined')
    ? import('firebase/analytics')
        .then(({ getAnalytics, isSupported }) => isSupported().then(yes => yes ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-west1'); // Set region to match Cloud Functions deployment
const googleProvider = new GoogleAuthProvider();

// Connect to emulators if VITE_USE_FIREBASE_EMULATOR=true
// Usage: add VITE_USE_FIREBASE_EMULATOR=true to .env.local then restart dev server
const isDevelopment = viteEnv.DEV === true ||
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');

const useEmulator = isDevelopment && (
    getClientEnvFlag('VITE_USE_FIREBASE_EMULATOR', 'NEXT_PUBLIC_USE_FIREBASE_EMULATOR')
);
if (useEmulator) {
    import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
        connectFirestoreEmulator(db, 'localhost', 8080);
    });
    import('firebase/functions').then(({ connectFunctionsEmulator }) => {
        connectFunctionsEmulator(functions, 'localhost', 5001);
    });
    connectStorageEmulator(storage, 'localhost', 9199);
    if (viteEnv.DEV === true) {
        console.debug('[Firebase] Connected to local emulators (Firestore:8080, Functions:5001, Storage:9199)');
    }
}


export { auth, db, storage, googleProvider, analytics, functions };
