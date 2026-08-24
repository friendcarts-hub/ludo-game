import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyA9Hh__NHkL_6L56rwhVTUvsfWSSmczF5g",
  authDomain: firebaseConfigJson.authDomain || "graphite-sylph-59brs.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "graphite-sylph-59brs",
  storageBucket: firebaseConfigJson.storageBucket || "graphite-sylph-59brs.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "294841989300",
  appId: firebaseConfigJson.appId || "1:294841989300:web:cc3f50afacaa1c86053fe1",
};

// Initialize Firebase safely
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase initialized with fallback:', e);
}

const firestoreDatabaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';

export const auth = app ? getAuth(app) : null;
export const db = app
  ? firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app)
  : null;

// Validate connection to Firestore on boot
export async function testFirestoreConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline. Using local cache / state.');
    }
  }
}

testFirestoreConnection();

export default app;
