/**
 * @react-native-firebase/firestore stub for macOS bundles ONLY
 * (wired up in metro.config.js; iOS/Android resolve the real
 * package).
 *
 * React Native Firebase has no react-native-macos build. Every
 * Firestore use in this app (profile ensure, progress sync, push
 * token save) is best-effort and wrapped in try/catch with the local
 * AsyncStorage cache as the source of truth, so inert no-op writes
 * are the correct Mac behavior: nothing syncs, nothing crashes, and
 * local progress keeps working fully offline.
 */

export type Firestore = Record<string, unknown>;

export function getFirestore(): Firestore {
  return {};
}

export function doc(_db: unknown, ..._segments: string[]): Record<string, unknown> {
  return {};
}

export async function setDoc(): Promise<void> {}

export async function getDoc(): Promise<{ exists: () => boolean; data: () => undefined }> {
  return { exists: () => false, data: () => undefined };
}

export function serverTimestamp(): null {
  return null;
}

export default { getFirestore, doc, setDoc, serverTimestamp };
