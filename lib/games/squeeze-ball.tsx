import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

/** Squeeze Ball — press a soft shape, watch it spring back. */
export default function SqueezeBallGame() {
  const [squeezes, setSqueezes] = useState(0);
  const [holding, setHolding] = useState(false);
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    setHolding(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(scaleX, { toValue: 1.18, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: 0.78, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    setHolding(false);
    setSqueezes((n) => n + 1);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void playSound('pop');
    Animated.spring(scaleX, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
    Animated.spring(scaleY, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  };

  return (
    <GameShell gameId="squeeze-ball" title="Squeeze Ball" subtitle="Press and hold the soft shape, then let go and watch it spring back.">
      <View style={styles.stage}>
        <Animated.View
          style={[styles.ball, { transform: [{ scaleX }, { scaleY }] }]}
          onTouchStart={pressIn}
          onTouchEnd={pressOut}
        >
          <Text style={styles.ballText}>{holding ? 'Squeeze…' : 'Press & hold'}</Text>
        </Animated.View>
      </View>
      <Text style={styles.count}>
        {squeezes === 0 ? 'Hold as long as you like — there is no rush.' : `${squeezes} gentle squeeze${squeezes === 1 ? '' : 's'}.`}
      </Text>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 320 },
  ball: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(185,168,232,0.35)',
    borderWidth: 2,
    borderColor: '#B9A8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballText: { color: '#EDE8FB', fontSize: 17, fontWeight: '700' },
  count: { color: Colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: 16 },
});
