import { doc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { db } from './firebase';

/**
 * Hugbug profile — one document per account in the `profiles`
 * collection (doc id = uid, fields email + updatedAt). Best-effort:
 * when Firestore isn't reachable (or the database hasn't been created
 * yet in the Firebase console) this is a no-op and the app still works
 * fully offline with local progress.
 */
export async function ensureProfile(userId: string, email: string): Promise<void> {
  try {
    await setDoc(
      doc(db, 'profiles', userId),
      { email, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // Non-fatal: the profile self-heals on the next call.
  }
}
