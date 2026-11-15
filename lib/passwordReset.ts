import { sendPasswordResetEmail } from '@react-native-firebase/auth';
import { firebaseAuth } from './firebase';

/**
 * Password reset, on Firebase Auth.
 *
 * Firebase sends the reset email with a link to a Firebase-hosted page
 * where the user chooses the new password — there is no deep link back
 * into the app (unlike the old Supabase flow). After resetting, the user
 * signs in with the new password.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(firebaseAuth, email);
}

/**
 * Kept for the auth gate (app/index.tsx): a flag the gate checks before
 * routing. Firebase's reset flow never sets it — the reset completes on
 * the web page — so it stays false; the gate's check is inert but
 * harmless, and the flag functions remain for any future in-app flow.
 */
let resetPending = false;

export function markPasswordResetPending() {
  resetPending = true;
}

/** Peek without consuming — the auth provider checks this before it
 *  routes a fresh session into the tabs. */
export function isPasswordResetPending(): boolean {
  return resetPending;
}

export function takePasswordResetPending(): boolean {
  const value = resetPending;
  resetPending = false;
  return value;
}
