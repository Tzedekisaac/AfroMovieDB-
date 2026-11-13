import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json' with { type: 'json' };

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId || "naijareel-77079",
  authDomain: firebaseConfigData.authDomain || "naijareel-77079.firebaseapp.com",
  apiKey: firebaseConfigData.apiKey || "AIzaSyD2C56QFD5tCnCew9oj-30_oL0nA8c2YWw",
  storageBucket: firebaseConfigData.storageBucket || "naijareel-77079.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "954650311829",
  appId: firebaseConfigData.appId || "1:954650311829:web:26462a135903d37db56f9c",
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || "(default)"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Suppress transient backend reconnection and offline notices in preview/iframe environment
try {
  setLogLevel('silent');
} catch {}

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Validate Firestore connection in browser environments
if (typeof window !== 'undefined') {
  getDocFromServer(doc(db, 'test', 'connection')).catch((error: unknown) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  });
}

export default app;
