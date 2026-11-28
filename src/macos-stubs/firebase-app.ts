/**
 * @react-native-firebase/app stub for macOS bundles ONLY (wired up in
 * metro.config.js; iOS/Android resolve the real package).
 *
 * React Native Firebase ships no react-native-macos build, so the
 * module cannot resolve for the macos platform. The Mac app therefore
 * runs with Firebase disconnected: lib/firebase.ts still calls
 * getApp()/getAuth()/getFirestore() at import, so this stub returns
 * inert objects; the auth stub reports a permanently signed-out
 * session and the firestore stub swallows the app's best-effort
 * writes (every Firestore call site in this app is already wrapped
 * in try/catch and falls back to the local AsyncStorage cache).
 */

export type FirebaseApp = { name: string; options: Record<string, unknown> };

const app: FirebaseApp = { name: '[DEFAULT]', options: {} };

export function getApp(): FirebaseApp {
  return app;
}

export function getApps(): FirebaseApp[] {
  return [app];
}

export function initializeApp(): FirebaseApp {
  return app;
}

export function deleteApp(): Promise<void> {
  return Promise.resolve();
}

export default { getApp, getApps, initializeApp };
