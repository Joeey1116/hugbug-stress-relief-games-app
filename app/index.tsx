import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { HugbugMark } from '../components/HugbugMark';
import { useAuth } from '../lib/auth';
import { takePasswordResetPending } from '../lib/passwordReset';
import { takeEmailConfirmationFailed } from '../lib/emailConfirmed';
import { Colors } from '../lib/theme';

/**
 * Auth gate: branded splash while AuthProvider restores the session,
 * then route on the resolved state — signed-in users to the tabs,
 * everyone else to onboarding. The gate no longer polls getSession():
 * the provider's restore already includes any cold-start deep-link
 * exchange, so when status resolves, the answer is final.
 */
export default function AuthGate() {
  const { status } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status === 'loading' || !minSplashDone) return;
    if (takePasswordResetPending()) {
      router.replace('/reset-password');
      return;
    }
    if (status === 'signedIn') {
      router.replace('/(tabs)');
      return;
    }
    if (takeEmailConfirmationFailed()) {
      router.replace('/sign-in');
      return;
    }
    router.replace('/onboarding');
  }, [status, minSplashDone]);

  return (
    <View style={styles.wrap}>
      <HugbugMark size={110} />
      <Text style={styles.title}>HUGBUG</Text>
      <Text style={styles.subtitle}>STRESS RELIEF GAMES</Text>
      <Text style={styles.tagline}>No timers. No losing. No ads.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: '#ffffff', fontSize: 32, fontWeight: '800', letterSpacing: 8, marginTop: 24 },
  subtitle: { color: '#888888', fontSize: 13, fontWeight: '800', letterSpacing: 4, marginTop: 8 },
  tagline: { color: '#555555', fontSize: 14, marginTop: 16, fontStyle: 'italic' },
});
