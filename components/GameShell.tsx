import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { recordCalmMoment } from '../lib/progress';
import { Colors } from '../lib/theme';

/**
 * Shared game shell — every mini-game renders inside this.
 * Back + Done, calm header, and one recorded calm moment per visit.
 * No timers, no scores, no fail states anywhere in the shell.
 */
export function GameShell({
  gameId,
  title,
  subtitle,
  children,
}: {
  gameId: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { userId } = useAuth();

  useEffect(() => {
    void recordCalmMoment(userId, gameId);
  }, [gameId, userId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.doneBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: { paddingVertical: 8 },
  backText: { color: Colors.textSoft, fontSize: 16, fontWeight: '600' },
  doneBtn: {
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(143,216,181,0.4)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  doneText: { color: Colors.accent, fontSize: 15, fontWeight: '700' },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  subtitle: { color: Colors.textMuted, fontSize: 15, paddingHorizontal: 20, marginTop: 6, lineHeight: 21 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
});
