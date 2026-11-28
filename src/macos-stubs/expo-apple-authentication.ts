/**
 * expo-apple-authentication stub for macOS bundles ONLY (wired up in
 * metro.config.js; iOS/Android resolve the real package).
 *
 * Apple Sign In via expo-apple-authentication has no macOS build in
 * this project. The sign-in/sign-up screens and lib/auth.tsx load it
 * with a dynamic import inside try/catch, and signInAsync rejecting
 * here surfaces as their normal "Apple sign-in failed" path — no
 * session is ever fabricated on Mac.
 */

export enum AppleAuthenticationScope {
  FULL_NAME = 0,
  EMAIL = 1,
}

export async function isAvailableAsync(): Promise<boolean> {
  return false;
}

export async function signInAsync(): Promise<never> {
  throw new Error('Apple sign-in is not available in the Mac app yet.');
}

export default { AppleAuthenticationScope, isAvailableAsync, signInAsync };
