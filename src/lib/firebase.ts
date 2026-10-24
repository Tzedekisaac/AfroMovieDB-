import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "naijareel-77079",
  authDomain: "naijareel-77079.firebaseapp.com",
  apiKey: "AIzaSyD2C56QFD5tCnCew9oj-30_oL0nA8c2YWw",
  storageBucket: "naijareel-77079.firebasestorage.app",
  messagingSenderId: "954650311829",
  appId: "1:954650311829:web:26462a135903d37db56f9c"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Suppress non-critical backend reconnection notices in iframe/proxy environments
try {
  setLogLevel('error');
} catch {}

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    }
  );
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
