import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

/**
 * Pattern Memory — remember the pattern, no rush. A wrong tap never
 * fails you: the pattern simply plays again, gently.
 */
export default function PatternMemoryGame() {
  const [sequence, setSequence] = useState<number[]>(() => [Math.floor(Math.random() * 9)]);
  const [showing, setShowing] = useState(false);
  const [lit, setLit] = useState<number | null>(null);
  const [inputIdx, setInputIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [note, setNote] = useState('Watch the pattern, then tap it back.');
  const [started, setStarted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const showSequence = (seq: number[]) => {
    setShowing(true);
    setNote('Watch…');
    setInputIdx(0);
    seq.forEach((pad, i) => {
      timers.current.push(
        setTimeout(() => {
          setLit(pad);
          void playSound('chime');
          timers.current.push(setTimeout(() => setLit(null), 450));
          if (i === seq.length - 1) {
            timers.current.push(
              setTimeout(() => {
                setShowing(false);
                setNote('Your turn — tap the pads in the same order.');
              }, 650),
            );
          }
        }, 700 + i * 750),
      );
    });
  };

  const start = () => {
    const seq = [Math.floor(Math.random() * 9)];
    setSequence(seq);
    setRound(1);
    setStarted(true);
    showSequence(seq);
  };

  const tapPad = (pad: number) => {
    if (!started || showing) return;
    setLit(pad);
    setTimeout(() => setLit(null), 250);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pad === sequence[inputIdx]) {
      void playSound('ripple');
      const nextIdx = inputIdx + 1;
      if (nextIdx === sequence.length) {
        // Round complete — grow the pattern by one.
        const next = [...sequence, Math.floor(Math.random() * 9)];
        setSequence(next);
        setRound((r) => r + 1);
        setNote('Beautiful. One more step this time.');
        void playSound('complete');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        timers.current.push(setTimeout(() => showSequence(next), 1100));
      } else {
        setInputIdx(nextIdx);
      }
    } else {
      // No fail state: just watch it again.
      setNote('No rush — watch it once more, then try again.');
      timers.current.push(setTimeout(() => showSequence(sequence), 1100));
    }
  };

  return (
    <GameShell gameId="pattern-memory" title="Pattern Memory" subtitle="Watch the lights, then tap them back in the same order. If you miss one, the pattern simply plays again.">
      <View style={styles.grid}>
        {Array.from({ length: 9 }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.pad, lit === i && styles.padLit]}
            onPress={() => tapPad(i)}
            activeOpacity={0.85}
            disabled={!started || showing}
          />
        ))}
      </View>
      <Text style={styles.note}>{note}</Text>
      <Text style={styles.round}>{started ? `Round ${round} · ${sequence.length} step${sequence.length === 1 ? '' : 's'}` : 'Take a breath first.'}</Text>
      {!started && (
        <TouchableOpacity style={styles.start} onPress={start} activeOpacity={0.8}>
          <Text style={styles.startText}>SHOW ME THE PATTERN</Text>
        </TouchableOpacity>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 280, alignSelf: 'center', marginTop: 20 },
  pad: {
    width: 86,
    height: 86,
    borderRadius: 20,
    backgroundColor: 'rgba(156,200,232,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(156,200,232,0.3)',
  },
  padLit: { backgroundColor: '#9CC8E8', borderColor: '#9CC8E8' },
  note: { color: Colors.textSoft, fontSize: 16, textAlign: 'center', marginTop: 28, lineHeight: 23, paddingHorizontal: 8 },
  round: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 10 },
  start: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 48,
  },
  startText: { color: '#0B1120', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});
