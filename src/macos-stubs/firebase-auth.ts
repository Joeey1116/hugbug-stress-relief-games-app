/**
 * @react-native-firebase/auth stub for macOS bundles ONLY (wired up
 * in metro.config.js; iOS/Android resolve the real package).
 *
 * React Native Firebase has no react-native-macos build. Semantics
 * mirror the real SDK's signed-out state: onAuthStateChanged fires
 * once with null (so AuthProvider settles at 'signedOut' and the app
 * lands on onboarding, exactly like a signed-out phone), and every
 * sign-in / sign-up attempt rejects with a clear "not available on
 * Mac yet" error that the existing screens surface as a normal
 * sign-in failure. No session is ever fabricated and no user is ever
 * signed in by this stub.
 */

export type User = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
};

export type Auth = { currentUser: User | null; app: unknown };

const authInstance: Auth = { currentUser: null, app: null };

export function getAuth(): Auth {
  return authInstance;
}

function unavailable(): Error {
  return new Error('Sign-in is not available in the Mac app yet.');
}

export function onAuthStateChanged(
  _auth: Auth,
  cb: (user: User | null) => void,
): () => void {
  // Fire asynchronously, like the real SDK's first restore callback.
  const t = setTimeout(() => cb(null), 0);
  return () => clearTimeout(t);
}

export async function signInWithEmailAndPassword(): Promise<never> {
  throw unavailable();
}

export async function createUserWithEmailAndPassword(): Promise<never> {
  throw unavailable();
}

export async function signInWithCredential(): Promise<never> {
  throw unavailable();
}

export async function signOut(): Promise<void> {
  // Already signed out on Mac.
}

export async function reload(): Promise<void> {}

export async function sendEmailVerification(): Promise<never> {
  throw unavailable();
}

export async function sendPasswordResetEmail(): Promise<never> {
  throw unavailable();
}

export async function updatePassword(): Promise<never> {
  throw unavailable();
}

export const GoogleAuthProvider = {
  credential: (_token: string) => ({ providerId: 'google.com' }),
};

export const AppleAuthProvider = {
  credential: (_token: string) => ({ providerId: 'apple.com' }),
};

export default { getAuth, onAuthStateChanged };
