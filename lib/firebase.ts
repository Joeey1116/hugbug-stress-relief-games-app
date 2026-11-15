import { getApp, type FirebaseApp } from '@react-native-firebase/app';
import { getAuth, type Auth } from '@react-native-firebase/auth';
import { getFirestore, type Firestore } from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Firebase — the Hugbug backend (Nov 15, 2026 decision: one Firebase
 * project, "BeaTrackFam Apps" (Spark/free plan), holds all the new apps.
 * Supabase is gone — no Supabase code remains in this repo.
 *
 * The native config files live at the repo root (google-services.json
 * for Android, GoogleService-Info.plist for iOS) and are wired into the
 * native projects by the @react-native-firebase/app config plugin at
 * prebuild time. Auth providers enabled in the console: Google + Apple
 * (Apple Services ID com.beatrackfaminc.signin).
 */

// Web (server) OAuth client id from google-services.json — needed so
// Google sign-in returns an idToken Firebase Auth can accept. This is a
// client identifier, not a secret; it ships in the app bundle.
const WEB_CLIENT_ID = '540704006558-efnranrjakji3clmn7bmuj74bdt5hmph.apps.googleusercontent.com';

let app: FirebaseApp;
// The native SDK auto-registers the default app from the bundled config
// files (GoogleService-Info.plist / google-services.json) at launch,
// before JS runs — getApp() is the normal path, no explicit initialize.
app = getApp();

export const firebaseApp: FirebaseApp = app;
export const firebaseAuth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Google Sign-In is configured once, at import. The webClientId is what
// makes signIn() return an idToken for Firebase; without it the native
// SDK only returns an auth code.
GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
