import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

interface Ripple {
  id: number;
  x: number;
  y: number;
  anim: Animated.Value;
}

let nextId = 0;
const RIPPLE_COLORS = ['#8FD8B5', '#9CC8E8', '#B9A8E8', '#F2B8A0'];

/** Ripple Tap — tap anywhere, watch the ripples spread. */
export default function RippleTapGame() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [taps, setTaps] = useState(0);
  const colorIdx = useRef(0);

  const tap = (e: any) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    const anim = new Animated.Value(0);
    const id = nextId++;
    const color = RIPPLE_COLORS[colorIdx.current % RIPPLE_COLORS.length];
    colorIdx.current += 1;
    setRipples((prev) => [...prev.slice(-11), { id, x, y, anim }]);
    setTaps((n) => n + 1);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void playSound('ripple');
    Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true }).start(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    });
    void color;
  };

  return (
    <GameShell gameId="ripple-tap" title="Ripple Tap" subtitle="Tap anywhere on the water. Watch the ripples spread and fade — nothing to win, nothing to lose.">
      <Pressable style={styles.pond} onPress={tap}>
        {ripples.map((r) => (
          <Animated.View
            key={r.id}
            pointerEvents="none"
            style={[
              styles.ripple,
              {
                left: r.x - 70,
                top: r.y - 70,
                opacity: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                transform: [{ scale: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) }],
              },
            ]}
          />
        ))}
        <Text style={styles.hint}>Tap the water</Text>
      </Pressable>
      <Text style={styles.count}>{taps === 0 ? 'The water is still. Go on.' : `${taps} ripple${taps === 1 ? '' : 's'} so far.`}</Text>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  pond: {
    flex: 1,
    minHeight: 380,
    borderRadius: 24,
    backgroundColor: 'rgba(156,200,232,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(156,200,232,0.35)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#9CC8E8',
  },
  hint: { color: 'rgba(156,200,232,0.7)', fontSize: 16, fontWeight: '600' },
  count: { color: Colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: 16 },
});
