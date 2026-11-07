import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/Screen';
import { HugbugMark } from '../components/HugbugMark';
import { GlassCard } from '../components/GlassCard';
import { maybeRequestTracking } from '../lib/tracking';

/**
 * Consent-first onboarding (Motivation pattern): the player is told
 * plainly what the app does and doesn't do BEFORE any account step —
 * no ads, no timers, no losing, progress tied to their account.
 * The ATT prompt fires here, once, after the player has seen the
 * promise — never before first paint.
 */
const STEPS = [
  { num: '01', title: 'SLOW DOWN', text: 'A library of calm mini-games — squishy, puzzles, and focus — made for stressed and anxious moments.' },
  { num: '02', title: 'NO PRESSURE', text: 'No timers. No losing. No ads popping up mid-calm. A wrong tap just waits for you to try again.' },
  { num: '03', title: 'YOURS, GENTLY', text: 'Your progress lives on your account and is cached for offline. Streaks never punish a missed day.' },
];

export default function Onboarding() {
  const [page, setPage] = useState(0);

  // ATT once, after the player has seen what the app is (page 2+).
  useEffect(() => {
    if (page >= 1) {
      void maybeRequestTracking();
    }
  }, [page]);

  return (
    <Screen>
      {page === 0 && (
        <View style={styles.page}>
          <View style={styles.hero}>
            <HugbugMark size={132} />
            <Text style={styles.brand}>HUGBUG</Text>
            <Text style={styles.headline}>SLOW DOWN.{'\n'}BREATHE.{'\n'}PLAY.</Text>
            <Text style={styles.subline}>Stress relief games — calm, always.</Text>
          </View>
          <Text style={styles.intro}>
            When the day feels heavy, Hugbug is a quiet place to land. Pop a bubble, tend a garden, find your way
            through a maze — at whatever pace feels right.
          </Text>
        </View>
      )}

      {page === 1 && (
        <View style={styles.page}>
          <Text style={styles.headline}>HOW IT WORKS.</Text>
          <Text style={styles.subline}>Three promises. Zero fine print.</Text>
          <View style={styles.steps}>
            {STEPS.map((s) => (
              <GlassCard key={s.num} style={styles.stepCard}>
                <Text style={styles.stepNum}>{s.num}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepText}>{s.text}</Text>
              </GlassCard>
            ))}
          </View>
        </View>
      )}

      {page === 2 && (
        <View style={styles.page}>
          <View style={styles.hero}>
            <HugbugMark size={104} />
            <Text style={styles.headline}>COME ON IN.</Text>
            <Text style={styles.subline}>Your calm corner is waiting.</Text>
          </View>
          <TouchableOpacity style={styles.primary} onPress={() => router.push('/sign-up')} activeOpacity={0.8}>
            <Text style={styles.primaryText}>CREATE MY ACCOUNT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => router.push('/sign-in')} activeOpacity={0.8}>
            <Text style={styles.secondaryText}>I have an account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/privacy-policy')} activeOpacity={0.8}>
            <Text style={styles.privacyLink}>Read our Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        {page < 2 ? (
          <TouchableOpacity style={styles.primary} onPress={() => setPage(page + 1)} activeOpacity={0.8}>
            <Text style={styles.primaryText}>{page === 0 ? 'HOW IT WORKS' : 'GET STARTED'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fineWrap}>
            <Text style={styles.fine}>No timers • No losing • No ads</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hero: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  brand: { color: '#888888', fontSize: 13, fontWeight: '800', letterSpacing: 6, marginTop: 20 },
  headline: { color: '#ffffff', fontSize: 36, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 16, lineHeight: 44 },
  subline: { color: '#888888', fontSize: 16, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  intro: { color: '#aaaaaa', fontSize: 15, lineHeight: 24, textAlign: 'center', paddingHorizontal: 12 },
  steps: { marginTop: 20 },
  stepCard: { marginBottom: 12 },
  stepNum: { color: '#555555', fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  stepTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: 2, marginTop: 6 },
  stepText: { color: '#bbbbbb', fontSize: 14, lineHeight: 21, marginTop: 8 },
  primary: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  primaryText: { color: '#000000', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  secondary: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 8 },
  secondaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  privacyLink: { color: '#888888', fontSize: 13, textAlign: 'center', marginTop: 12, textDecorationLine: 'underline' },
  footer: { paddingBottom: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333333', marginHorizontal: 5 },
  dotActive: { backgroundColor: '#ffffff', width: 24 },
  fineWrap: { alignItems: 'center', paddingVertical: 18 },
  fine: { color: '#555555', fontSize: 12, letterSpacing: 1 },
});
