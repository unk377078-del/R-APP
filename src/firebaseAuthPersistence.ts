import { FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

export function createFirebaseAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}
