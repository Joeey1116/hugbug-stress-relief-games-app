import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../lib/auth';
import { loadProgress, type ProgressState } from '../../lib/progress';
import { loadSettings, saveSettings } from '../../lib/settings';
import { Colors } from '../../lib/theme';

/** You — profile, gentle progress, sounds (incl. mute), notifications, sign out. */
export default function You() {
  const { email, userId, signOut } = useAuth();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [muted, setMuted] = useState(false);
  const [reminders, setReminders] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void loadProgress(userId).then((p) => {
        if (alive) setProgress(p);
      });
      void loadSettings().then((s) => {
        if (alive) {
          setMuted(s.muted);
          setReminders(s.remindersEnabled);
        }
      });
      return () => {
        alive = false;
      };
    }, [userId]),
  );

  const toggleMute = async (value: boolean) => {
    setMuted(value);
    await saveSettings({ muted: value });
  };

  const toggleReminders = async (value: boolean) => {
    setReminders(value);
    await saveSettings({ remindersEnabled: value });
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'Your progress is saved to your account — it will be here when you come back.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const plays = progress ? Object.values(progress.plays).reduce((a, b) => a + b, 0) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>YOU</Text>
        <Text style={styles.title}>Your calm space</Text>
        <Text style={styles.email}>{email ?? ''}</Text>

        <GlassCard>
          <Text style={styles.cardTitle}>GENTLE PROGRESS</Text>
          <Text style={styles.big}>{progress?.streakDays ?? 0} day{progress?.streakDays === 1 ? '' : 's'}</Text>
          <Text style={styles.cardText}>
            {progress?.streakDays && progress.streakDays > 0
              ? 'of calm moments in a row. A missed day never breaks anything — it just rests, and starts again when you come back.'
              : 'Your streak starts the next time you play or breathe. No pressure — a missed day never counts against you.'}
          </Text>
          <Text style={styles.cardStat}>{progress?.totalCalmMoments ?? 0} calm moments so far · {plays} games played</Text>
        </GlassCard>

        <GlassCard>
          <Text style={styles.cardTitle}>SOUNDS</Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Gentle sounds</Text>
              <Text style={styles.rowHint}>Soft chimes while you play. Off means fully silent.</Text>
            </View>
            <Switch value={!muted} onValueChange={(v) => void toggleMute(!v)} trackColor={{ false: '#333333', true: Colors.accentDeep }} thumbColor="#ffffff" />
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.cardTitle}>REMINDERS</Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Daily calm reminder</Text>
              <Text style={styles.rowHint}>One gentle nudge each evening to take a quiet moment.</Text>
            </View>
            <Switch value={reminders} onValueChange={(v) => void toggleReminders(v)} trackColor={{ false: '#333333', true: Colors.accentDeep }} thumbColor="#ffffff" />
          </View>
        </GlassCard>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/privacy-policy')} activeOpacity={0.8}>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Hugbug: Stress Relief Games · v1.0.0 (1000)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 },
  kicker: { color: Colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  title: { color: Colors.text, fontSize: 32, fontWeight: '800', marginTop: 8 },
  email: { color: Colors.textMuted, fontSize: 14, marginTop: 6, marginBottom: 20 },
  cardTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  big: { color: Colors.accent, fontSize: 40, fontWeight: '800' },
  cardText: { color: Colors.textSoft, fontSize: 14, lineHeight: 21, marginTop: 8 },
  cardStat: { color: Colors.textMuted, fontSize: 13, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, paddingRight: 16 },
  rowLabel: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  rowHint: { color: Colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 4,
  },
  linkText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  linkArrow: { color: Colors.textMuted, fontSize: 20 },
  signOut: {
    borderWidth: 1,
    borderColor: 'rgba(255,154,154,0.4)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: { color: '#FF9A9A', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  version: { color: '#5A6478', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
