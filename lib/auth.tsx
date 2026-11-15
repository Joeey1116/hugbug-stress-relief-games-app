import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  AppleAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { firebaseAuth } from './firebase';
import { isPasswordResetPending, requestPasswordReset } from './passwordReset';
import { ensureProfile } from './profile';

/**
 * AuthProvider — the ONE owner of session state, now on Firebase Auth
 * (Nov 15, 2026: Supabase removed, one Firebase project "BeaTrackFam
 * Apps" holds all the new apps).
 *
 * Same shape as before: this provider restores the persisted session
 * exactly once at launch from the native SDK's single
 * onAuthStateChanged subscription, keeps state current from it, and
 * performs the auth-driven navigation reactions. Screens CONSUME state
 * via useAuth() and call the provider's sign-in/sign-up methods; the
 * gate waits for status instead of polling.
 *
 * Email verification: Firebase signs a user in the moment the account
 * is created, even before the confirmation link is tapped — so this
 * provider only reports 'signedIn' for a user whose email is verified
 * (Google/Apple accounts are verified by definition). An unverified
 * email user stays signed in to Firebase (so the confirmation email
 * can be resent) but the app treats them as signed out: no navigation
 * into the tabs, and the sign-in screen shows the resend option.
 * Firebase confirmation links open a Firebase-hosted page (no deep
 * link back into the app), so there is no confirmation deep-link
 * handling here — after tapping the link the user signs in again and
 * the fresh sign-in sees the verified email.
 */

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

/** Thrown by signInWithEmail when the account exists but the email is
 * not verified yet. Screens check `err.code === 'auth/email-not-verified'`
 * and show the resend-confirmation UI instead of a generic error. */
export const EMAIL_NOT_VERIFIED_CODE = 'auth/email-not-verified';

function emailNotVerifiedError(): Error {
  const err = new Error('email-not-verified') as Error & { code?: string };
  err.code = EMAIL_NOT_VERIFIED_CODE;
  return err;
}

/** Thrown when the user dismisses the native Google/Apple sheet. Screens
 * swallow this silently — cancelling is not an error. */
export const SIGN_IN_CANCELLED_CODE = 'auth/sign-in-cancelled';

function signInCancelledError(): Error {
  const err = new Error('sign-in-cancelled') as Error & { code?: string };
  err.code = SIGN_IN_CANCELLED_CODE;
  return err;
}

export interface AuthContextValue {
  status: AuthStatus;
  session: User | null;
  user: User | null;
  /** Signed-in user's id, or null when signed out. The tabs are
   * session-guarded — a null id never reaches a tab screen. */
  userId: string | null;
  /** Signed-in user's email, or null. */
  email: string | null;
  /** Firebase is configured via the bundled config files
   * (google-services.json / GoogleService-Info.plist) — always true. */
  configured: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signInWithApple: () => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  session: null,
  user: null,
  userId: null,
  email: null,
  configured: true,
  signOut: async () => {},
  signInWithEmail: async () => {
    throw new Error('AuthProvider not mounted');
  },
  signUpWithEmail: async () => {
    throw new Error('AuthProvider not mounted');
  },
  signInWithGoogle: async () => {
    throw new Error('AuthProvider not mounted');
  },
  signInWithApple: async () => {
    throw new Error('AuthProvider not mounted');
  },
  sendPasswordReset: async () => {
    throw new Error('AuthProvider not mounted');
  },
  resendVerificationEmail: async () => {
    throw new Error('AuthProvider not mounted');
  },
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const segmentsRef = useRef<(string | undefined)[]>(segments as (string | undefined)[]);
  segmentsRef.current = segments as (string | undefined)[];

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  /* ---- the single restore + subscription effect ---- */

  useEffect(() => {
    // The one subscription. Every auth change flows through here into
    // context state; screens never resolve the session on their own.
    // A persisted session restores here on launch — no polling, no
    // manual token upkeep (the native SDK refreshes tokens itself).
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      void (async () => {
        if (!fbUser) {
          setUser(null);
          setStatus('signedOut');
          return;
        }
        try {
          // Fresh claims: a user who tapped the confirmation link while
          // the app was closed must come back verified.
          await reload(fbUser);
        } catch {
          // Reload failed (offline, user deleted) — use cached claims.
        }
        setUser(fbUser);
        if (fbUser.emailVerified) {
          setStatus('signedIn');
          try {
            await ensureProfile(fbUser.uid, fbUser.email ?? '');
          } catch {
            // Non-fatal: profile self-heals on the next ensureProfile call.
          }
        } else {
          // Unverified email: stay out of the tabs (see header comment).
          setStatus('signedOut');
        }
      })();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /* ---- navigation reactions: act on auth TRANSITIONS only ---- */

  const prevStatusRef = useRef<AuthStatus>('loading');
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === status || status === 'loading') return;
    const top = segmentsRef.current[0];
    if (status === 'signedIn') {
      // A session appeared while sitting outside the app proper (gate,
      // onboarding, sign-in/sign-up). Password recovery also creates a
      // session — never hijack that flow into the tabs.
      if (top !== '(tabs)' && top !== 'reset-password' && !isPasswordResetPending()) {
        try {
          router.replace('/(tabs)');
        } catch {
          // Router not ready — the gate routes on the same state.
        }
      }
    } else if (status === 'signedOut') {
      if (top === '(tabs)') {
        try {
          router.replace('/onboarding');
        } catch {
          // Router not ready.
        }
      }
    }
  }, [status, router]);

  /* ---- auth actions (used by the sign-in / sign-up screens) ---- */

  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    try {
      await reload(cred.user);
    } catch {
      // Use the claims from the fresh sign-in.
    }
    if (!cred.user.emailVerified) {
      // Stay signed in to Firebase so the confirmation email can be
      // resent, but do not let the app treat this as signed in.
      throw emailNotVerifiedError();
    }
    return cred.user;
  };

  const signUpWithEmail = async (email: string, password: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // The account exists; the confirmation email can be resent from
      // the sign-in screen. Do not fail sign-up over it.
    }
    try {
      await ensureProfile(cred.user.uid, email);
    } catch {
      // Non-fatal.
    }
    // emailVerified is false for a fresh email/password account — the
    // listener keeps status at 'signedOut' and the screen shows the
    // "check your email" flow instead of routing into the tabs.
    return cred.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch {
      // iOS has no Play Services; hasPlayServices is an Android check.
    }
    let idToken: string | null = null;
    try {
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled') {
        throw signInCancelledError();
      }
      idToken = response.data?.idToken ?? null;
    } catch (err: any) {
      if (err?.code === SIGN_IN_CANCELLED_CODE) throw err;
      // The native SDK reports cancellation as an error on some
      // versions — treat it as a cancel, not a failure.
      const message = String(err?.message ?? err ?? '').toLowerCase();
      if (message.includes('cancel')) {
        throw signInCancelledError();
      }
      throw err;
    }
    if (!idToken) {
      // Fallback: tokens may be available without a fresh prompt.
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken ?? null;
      } catch {
        // Fall through to the error below.
      }
    }
    if (!idToken) {
      throw new Error('Google did not return a sign-in token. Try again.');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(firebaseAuth, credential);
    return cred.user;
  };

  const signInWithApple = async (): Promise<User> => {
    const AppleAuthentication = await import('expo-apple-authentication');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (!credential.identityToken) {
      throw new Error('Apple did not return a sign-in token. Try again.');
    }
    const appleCredential = AppleAuthProvider.credential(credential.identityToken);
    const cred = await signInWithCredential(firebaseAuth, appleCredential);
    try {
      // Apple only shares the email on the FIRST sign-in; prefer it for
      // the profile, fall back to whatever Firebase has.
      await ensureProfile(cred.user.uid, credential.email ?? cred.user.email ?? '');
    } catch {
      // Non-fatal.
    }
    return cred.user;
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await requestPasswordReset(email);
  };

  const resendVerificationEmail = async (): Promise<void> => {
    const current = firebaseAuth.currentUser;
    if (!current) {
      throw new Error('Sign in first, then resend the confirmation email.');
    }
    await sendEmailVerification(current);
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Best-effort: clears the cached Google account so the next
      // Google sign-in prompts for an account choice.
    }
    await firebaseSignOut(firebaseAuth).catch(() => {});
    setUser(null);
    setStatus('signedOut');
  };

  const value: AuthContextValue = {
    status,
    session: user,
    user,
    userId: user?.uid ?? null,
    email: user?.email ?? null,
    configured: true,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    sendPasswordReset,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
