import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDoFoPoaPMi6HkqsA1vn6oDPokG9btVJ3g",
    authDomain: "jastalk-firebase.firebaseapp.com",
    databaseURL: "https://jastalk-firebase-default-rtdb.firebaseio.com",
    projectId: "jastalk-firebase",
    storageBucket: "jastalk-firebase.appspot.com",
    messagingSenderId: "371634100960",
    appId: "1:371634100960:web:8ef53e663b37e14b9f0e85",
    measurementId: "G-BTZ1F392FM"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize Google Analytics and export it
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, functions, googleProvider, analytics };