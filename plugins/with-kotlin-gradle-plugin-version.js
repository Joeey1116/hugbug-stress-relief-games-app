/**
 * Expo config plugin: with-kotlin-gradle-plugin-version
 *
 * Pins the Kotlin Gradle plugin version on the buildscript classpath.
 *
 * Why this exists (Nov 24, 2026): the fresh Android build failed at
 * :react-native-firebase_auth:compileReleaseKotlin — firebase-auth 25.0.0
 * was compiled with Kotlin metadata 2.4.0, but the build's Kotlin compiler
 * was 2.1.20. Setting `kotlinVersion: "2.4.0"` in expo-build-properties did
 * NOT fix it: that only writes `android.kotlinVersion` to gradle.properties,
 * which feeds the Expo version catalog (`expoLibs`) and the `kotlinVersion`
 * extra (used for the KSP lookup) — it does not change the compiler.
 * The compiler version comes from the `kotlin-gradle-plugin` on the
 * buildscript classpath, whose version is pinned to 2.1.20 by React Native's
 * own version catalog (`node_modules/@react-native/gradle-plugin/gradle/
 * libs.versions.toml`). Pinning the classpath entry directly is the lever
 * that actually moves the compiler.
 *
 * Keep in sync with `kotlinVersion` in expo-build-properties (app.json):
 * both should name the same Kotlin version.
 */
const { withProjectBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

const KOTLIN_VERSION = '2.4.0';

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
