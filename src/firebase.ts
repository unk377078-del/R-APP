import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Functions, getFunctions } from 'firebase/functions';
import { createFirebaseAuth } from './firebaseAuthPersistence';

const DEFAULT_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: 'AIzaSyAuA4k2eloSG9MuoKCb8sAfuJf7GFWFvXo',
  authDomain: 'al-rashidi-poultry.firebaseapp.com',
  projectId: 'al-rashidi-poultry',
  storageBucket: 'al-rashidi-poultry.firebasestorage.app',
  messagingSenderId: '725578026883',
  appId: '1:725578026883:web:08bf9a41da268c8b7d70b6',
};

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

export const firebaseMissingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = firebaseMissingConfig.length === 0;

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    auth = createFirebaseAuth(app);
    storage = getStorage(app);
    functions = getFunctions(app, 'us-central1');
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export { auth, firestore, storage, functions };
