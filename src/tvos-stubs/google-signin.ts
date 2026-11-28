/**
 * @react-native-google-signin/google-signin stub for tvOS bundles
 * ONLY (wired up in metro.config.js; iOS/Android/macOS resolve their
 * own module — macOS uses src/macos-stubs/).
 *
 * Google Sign-In's podspec declares only ios, so react-native.config.js
 * gates the pod out of the tvOS install and the native module does not
 * exist on Apple TV. lib/firebase.ts calls GoogleSignin.configure() at
 * import (kept as a no-op here so the import path is safe), and
 * lib/auth.tsx's Google flow rejects through the same error path the
 * screens already handle — the TV app never fabricates a Google
 * session. Firebase email auth keeps working natively on tvOS.
 */

function unavailable(): Error {
  return new Error('Google sign-in is not available in the TV app yet.');
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
