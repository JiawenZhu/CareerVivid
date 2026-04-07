import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

// Helper to safely get env vars in both Vite (import.meta.env) and Next.js (process.env)
const firebaseConfig = {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : ''),
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : ''),
    databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL : ''),
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : ''),
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : ''),
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : ''),
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID : ''),
    measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID : '')
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-west1'); // Set region to match Cloud Functions deployment
const googleProvider = new GoogleAuthProvider();

// Connect to emulators if VITE_USE_FIREBASE_EMULATOR=true
// Usage: add VITE_USE_FIREBASE_EMULATOR=true to .env.local then restart dev server
const useEmulator = import.meta.env?.VITE_USE_FIREBASE_EMULATOR || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR : 'false');
if (useEmulator === 'true') {
    import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
        connectFirestoreEmulator(db, 'localhost', 8080);
    });
    import('firebase/functions').then(({ connectFunctionsEmulator }) => {
        connectFunctionsEmulator(functions, 'localhost', 5001);
    });
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('[Firebase] 🔧 Connected to local emulators (Firestore:8080, Functions:5001, Storage:9199)');
}


export { auth, db, storage, googleProvider, analytics, functions };