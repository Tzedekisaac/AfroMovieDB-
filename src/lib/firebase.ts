import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD2C56QFD5tCnCew9oj-30_oL0nA8c2YWw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'naijareel-77079.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'naijareel-77079',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'naijareel-77079.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '954650311829',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:954650311829:web:26462a135903d37db56f9c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-6ZYJ60BEKR'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
