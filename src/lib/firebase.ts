import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseAppletConfig) : getApps()[0];

export const db = firebaseAppletConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
