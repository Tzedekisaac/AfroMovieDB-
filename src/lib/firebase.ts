import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

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
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

export const db = firestoreDb;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
