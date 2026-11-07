import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BreathingSession } from '../../components/BreathingSession';
import { Colors } from '../../lib/theme';

/** Breathe — guided breathing sessions, always one tap away. */
export default function Breathe() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>BREATHE</Text>
        <Text style={styles.title}>Slow down</Text>
        <Text style={styles.sub}>A few quiet breaths. The circle grows as you breathe in and settles as you breathe out.</Text>
        <BreathingSession />
        <View style={styles.tip}>
          <Text style={styles.tipText}>Feeling wound up? Try the Deep 4 · 7 · 8 rhythm — the long exhale is the calming part.</Text>
        </View>
        <TouchableOpacity style={styles.playBtn} onPress={() => router.push('/game/bubble-pop' as any)} activeOpacity={0.8}>
          <Text style={styles.playBtnText}>OR POP A FEW BUBBLES INSTEAD →</Text>
        </TouchableOpacity>
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
  sub: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 6, marginBottom: 8 },
  tip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  tipText: { color: Colors.textSoft, fontSize: 14, lineHeight: 21 },
  playBtn: { alignItems: 'center', marginTop: 24 },
  playBtnText: { color: Colors.accent, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
