import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';

export function createFirebaseAuth(app: FirebaseApp): firebaseAuth.Auth {
  try {
    const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence;
    if (typeof getReactNativePersistence === 'function') {
      return (firebaseAuth as any).initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    }
    return firebaseAuth.getAuth(app);
  } catch {
    // Fast refresh may have initialized this Firebase app already.
    return firebaseAuth.getAuth(app);
  }
}
