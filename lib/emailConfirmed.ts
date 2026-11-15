import { reload } from '@react-native-firebase/auth';
import { firebaseAuth } from './firebase';

/**
 * Email verification, on Firebase Auth.
 *
 * Firebase confirmation links open a Firebase-hosted page (no deep link
 * back into the app). The app learns the email is verified by reloading
 * the user — the auth provider does this on every sign-in and on every
 * auth-state change, and only then reports 'signedIn'.
 */

/** Reload the current user and report whether their email is verified. */
export async function checkEmailVerified(): Promise<boolean> {
  const user = firebaseAuth.currentUser;
  if (!user) return false;
  try {
    await reload(user);
  } catch {
    // Offline — fall back to the cached verification state.
  }
  return user.emailVerified;
}

/**
 * Kept for the auth gate (app/index.tsx): flags the gate checks before
 * routing. The old Supabase confirmation deep link set these; Firebase
 * has no such link, so they are no longer set — the gate's checks are
 * inert but harmless.
 */
let confirmedPending = false;

export function markEmailConfirmedPending() {
  confirmedPending = true;
}

export function isEmailConfirmedPending(): boolean {
  return confirmedPending;
}

export function takeEmailConfirmedPending(): boolean {
  const value = confirmedPending;
  confirmedPending = false;
  return value;
}

let confirmationFailed = false;

export function markEmailConfirmationFailed() {
  confirmationFailed = true;
}

export function takeEmailConfirmationFailed(): boolean {
  const value = confirmationFailed;
  confirmationFailed = false;
  return value;
}
