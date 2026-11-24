/**
 * Expo config plugin: with-firebase-auth-version
 *
 * Forces firebase-auth down to 24.2.0, overriding the Firebase BOM
 * (35.0.2, from @react-native-firebase v27) which pins 25.0.0.
 *
 * Why (Nov 24, 2026 — verified by reading the published AARs' Kotlin
 * metadata, calibrated against kotlin-stdlib itself):
 * - firebase-auth 25.0.0 was compiled with Kotlin metadata 2.4.0, so it
 *   needs a Kotlin 2.4.0 compiler. Kotlin 2.4.0 cannot build this Expo
 *   version's :expo module: the Pika compiler plugin
 *   (io.github.lukmccall.pika:pika-compiler:0.3.2-<kotlin>) has no 2.4.0
 *   build published (latest is 0.3.2-2.3.20).
 * - firebase-auth 24.2.0 was compiled with Kotlin metadata 2.3, readable
 *   by the Kotlin 2.3.20 compiler (see with-kotlin-gradle-plugin-version.js).
 *   It is also the exact version @react-native-firebase v26.4.2 targeted
 *   (BOM 34.18.0), and v27's auth native code is identical to v26's apart
 *   from log lines and Java->Kotlin file conversions — so v27 works with it.
 * - Everything else stays on BOM 35.0.2: firebase-firestore 27.0.1 and
 *   firebase-common 23.0.0 are both metadata 2.1 (readable by any Kotlin
 *   >= 1.9), and firestore 27.x is REQUIRED — v27's firestore module uses
 *   the query-pipelines API (com.google.firebase.firestore.pipeline.*),
 *   which does not exist in firestore 26.x. Do NOT downgrade the whole BOM
 *   to 34.x: that would break the firestore module's compilation.
 *
 * Mechanism: RNFB's build.gradle files take the BOM version from
 * @react-native-firebase/app's package.json (sdkVersions.android.firebase)
 * with no override hook, so the version is forced here via Gradle's
 * resolutionStrategy, which takes precedence over the BOM platform
 * constraint. Applied in allprojects so it reaches the RNFB library
 * modules, not just the app module.
 */
const { withProjectBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

const FIREBASE_AUTH_VERSION = '24.2.0';
const MARKER = '[with-firebase-auth-version]';

const withFirebaseAuthVersion = (config) =>
  withProjectBuildGradle(config, (config) => {
    const before = config.modResults.contents;
    if (before.includes(MARKER)) {
      return config;
    }
    const injection =
      `  // ${MARKER} Firebase-auth ${FIREBASE_AUTH_VERSION} is the newest version\n` +
      `  // compiled with Kotlin metadata 2.3 (readable by Kotlin 2.3.20); 25.0.0\n` +
      `  // needs metadata 2.4, which has no published pika-compiler. Force it so\n` +
      `  // the Firebase BOM (35.0.2) doesn't pull 25.0.0. Do NOT downgrade the\n` +
      `  // whole BOM: firestore 27.x is required by @react-native-firebase v27.\n` +
      `  configurations.all {\n` +
      `    resolutionStrategy {\n` +
      `      force "com.google.firebase:firebase-auth:${FIREBASE_AUTH_VERSION}"\n` +
      `    }\n` +
      `  }\n`;
    const after = before.replace('allprojects {', `allprojects {\n${injection}`);
    if (after === before) {
      throw new Error(
        '[with-firebase-auth-version] Could not find the allprojects block in android/build.gradle — the template may have changed.'
      );
    }
    config.modResults.contents = after;
    return config;
  });

module.exports = createRunOncePlugin(
  withFirebaseAuthVersion,
  'with-firebase-auth-version',
  '1.0.0'
);
