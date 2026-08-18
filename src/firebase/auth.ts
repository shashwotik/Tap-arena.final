import {
  signInAnonymously as fbSignInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

export type { FirebaseUser };

export function watchAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInAsGuest() {
  const cred = await fbSignInAnonymously(auth);
  return cred.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser() {
  await fbSignOut(auth);
}

/** Turns Firebase's terse error codes into copy a player can act on. */
export function describeAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered — try signing in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts — please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
