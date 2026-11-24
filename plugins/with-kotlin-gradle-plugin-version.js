/**
 * Expo config plugin: with-kotlin-gradle-plugin-version
 *
 * Pins the Kotlin Gradle plugin version on the buildscript classpath.
 *
 * Why this exists (Nov 24, 2026): the fresh Android build failed at
 * :react-native-firebase_auth:compileReleaseKotlin — firebase-auth 25.0.0
 * was compiled with Kotlin metadata 2.4.0, but the build's Kotlin compiler
 * was 2.1.20. Setting `kotlinVersion` in expo-build-properties did NOT fix
 * it: that only writes `android.kotlinVersion` to gradle.properties, which
 * feeds the Expo version catalog (`expoLibs`) and the `kotlinVersion` extra
 * (used for the KSP lookup) — it does not change the compiler. The compiler
 * version comes from the `kotlin-gradle-plugin` on the buildscript
 * classpath, whose version is pinned to 2.1.20 by React Native's own version
 * catalog (`node_modules/@react-native/gradle-plugin/gradle/
 * libs.versions.toml`). Pinning the classpath entry directly is the lever
 * that actually moves the compiler.
 *
 * Why 2.3.20 (not 2.4.0): 2.4.0 was tried first (commit d570b91) and the
 * metadata error went away — but then :expo failed: the Pika compiler plugin
 * (`io.github.lukmccall.pika:pika-compiler:0.3.2-<kotlin>`, added by Expo's
 * gradle plugin) has NO 2.4.0 build published (latest is 0.3.2-2.3.20, verified
 * against Maven Central). So Kotlin 2.4.0 cannot build :expo with this Expo
 * version. 2.3.20 is the newest Kotlin that both (a) has a published
 * pika-compiler (0.3.2-2.3.20 exists) and (b) can read firebase-auth 24.2.0's
 * Kotlin metadata 2.3 (see with-firebase-auth-version.js — the BOM's auth
 * 25.0.0 is forced down to 24.2.0 for exactly this reason).
 *
 * FALLBACK if this ever breaks (e.g. AGP rejecting Kotlin 2.3): drop the
 * pin back to 2.1.20 (and kotlinVersion in app.json) and force
 * firebase-auth 24.0.0 instead — 24.0.0's metadata is 2.1, readable by the
 * stock 2.1.20 compiler. That is the zero-toolchain-risk combination.
 *
 * Keep in sync with `kotlinVersion` in expo-build-properties (app.json):
 * both should name the same Kotlin version.
 */
const { withProjectBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

const KOTLIN_VERSION = '2.3.20';

const withKotlinGradlePluginVersion = (config) =>
  withProjectBuildGradle(config, (config) => {
    const before = config.modResults.contents;
    const after = before.replace(
      "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
      `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}')`
    );
    if (after === before) {
      throw new Error(
        '[with-kotlin-gradle-plugin-version] Could not find the kotlin-gradle-plugin classpath line in android/build.gradle — the template may have changed.'
      );
    }
    config.modResults.contents = after;
    return config;
  });

module.exports = createRunOncePlugin(
  withKotlinGradlePluginVersion,
  'with-kotlin-gradle-plugin-version',
  '1.0.0'
);
