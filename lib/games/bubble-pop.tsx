import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

const BUBBLE_COLORS = ['#B9A8E8', '#8FD8B5', '#9CC8E8', '#F2B8A0', '#F2D492'];

interface Bubble {
  key: number;
  size: number;
  color: string;
  popped: boolean;
}

let nextKey = 0;
function makeBubble(): Bubble {
  return {
    key: nextKey++,
    size: 56 + Math.round(Math.random() * 36),
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    popped: false,
  };
}

/** Bubble Pop — slow pops, no combo pressure. A bubble drifts back on its own. */
export default function BubblePopGame() {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => Array.from({ length: 12 }, makeBubble));
  const [pops, setPops] = useState(0);
  const scales = useRef<Map<number, Animated.Value>>(new Map());

  const pop = (b: Bubble) => {
    if (b.popped) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void playSound('pop');
    setPops((n) => n + 1);
    const v = new Animated.Value(1);
    scales.current.set(b.key, v);
    Animated.timing(v, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    setBubbles((prev) => prev.map((x) => (x.key === b.key ? { ...x, popped: true } : x)));
    setTimeout(() => {
      setBubbles((prev) => prev.map((x) => (x.key === b.key ? makeBubble() : x)));
    }, 1100);
  };

  return (
    <GameShell gameId="bubble-pop" title="Bubble Pop" subtitle="Slow pops, no pressure. Tap a bubble whenever you like — a new one drifts back.">
      <View style={styles.grid}>
        {bubbles.map((b) => (
          <TouchableOpacity key={b.key} onPress={() => pop(b)} activeOpacity={0.9} disabled={b.popped}>
            <Animated.View
              style={[
                styles.bubble,
                {
                  width: b.size,
                  height: b.size,
                  borderRadius: b.size / 2,
                  backgroundColor: `${b.color}33`,
                  borderColor: b.color,
                  transform: [{ scale: scales.current.get(b.key) ?? 1 }],
                  opacity: b.popped ? 0 : 1,
                },
              ]}
            >
              <View style={[styles.shine, { width: b.size * 0.28, height: b.size * 0.28, borderRadius: b.size * 0.14 }]} />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.count}>{pops === 0 ? 'Take your time.' : `${pops} slow pop${pops === 1 ? '' : 's'} — nice and easy.`}</Text>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingTop: 12 },
  bubble: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  shine: { backgroundColor: 'rgba(255,255,255,0.5)', marginBottom: '22%', marginRight: '22%' },
  count: { color: Colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: 28 },
});
