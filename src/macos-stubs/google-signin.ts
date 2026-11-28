/**
 * @react-native-google-signin/google-signin stub for macOS bundles
 * ONLY (wired up in metro.config.js; iOS/Android resolve the real
 * package).
 *
 * Google Sign-In ships no react-native-macos build. lib/firebase.ts
 * calls GoogleSignin.configure() at import (kept as a no-op here so
 * the import path is safe), and lib/auth.tsx's Google flow rejects
 * through the same error path the screens already handle — the Mac
 * app never fabricates a Google session.
 */

function unavailable(): Error {
  return new Error('Google sign-in is not available in the Mac app yet.');
}

export const GoogleSignin = {
  configure: (_opts?: Record<string, unknown>): void => {},
  hasPlayServices: async (): Promise<boolean> => false,
  signIn: async (): Promise<never> => {
    throw unavailable();
  },
  signOut: async (): Promise<void> => {},
  getTokens: async (): Promise<never> => {
    throw unavailable();
  },
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export default GoogleSignin;
