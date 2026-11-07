import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playSound } from '../lib/sounds';
import { Colors } from '../lib/theme';

/**
 * Guided breathing — the always-there anchor of the app.
 * Patterns: Calm 4-4, Box 4-4-4-4, Deep 4-7-8. One slow circle grows on
 * the inhale and settles on the exhale. No timers counting down at you —
 * the circle is the clock, and it never rushes you.
 */
const PATTERNS = [
  { id: 'calm', label: 'Calm 4 · 4', phases: [{ label: 'Breathe in', secs: 4 }, { label: 'Breathe out', secs: 4 }] },
  { id: 'box', label: 'Box 4 · 4 · 4 · 4', phases: [{ label: 'Breathe in', secs: 4 }, { label: 'Hold', secs: 4 }, { label: 'Breathe out', secs: 4 }, { label: 'Rest', secs: 4 }] },
  { id: 'deep', label: 'Deep 4 · 7 · 8', phases: [{ label: 'Breathe in', secs: 4 }, { label: 'Hold', secs: 7 }, { label: 'Breathe out', secs: 8 }] },
] as const;

export function BreathingSession() {
  const [patternId, setPatternId] = useState<string>('calm');
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycles, setCycles] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0];
  const phase = pattern.phases[phaseIdx];

  const stopTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => stopTimer, []);

  const runPhase = (idx: number, cycleCount: number) => {
    const p = pattern.phases[idx];
    setPhaseIdx(idx);
    const growing = p.label === 'Breathe in';
    Animated.timing(scale, {
      toValue: growing ? 1.55 : 1,
      duration: p.secs * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void playSound('breath');
    timer.current = setTimeout(() => {
      const next = idx + 1;
      if (next >= pattern.phases.length) {
        setCycles(cycleCount + 1);
        runPhase(0, cycleCount + 1);
      } else {
        runPhase(next, cycleCount);
      }
    }, p.secs * 1000);
  };

  const start = () => {
    setRunning(true);
    setCycles(0);
    runPhase(0, 0);
  };

  const stop = () => {
    stopTimer();
    setRunning(false);
    setPhaseIdx(0);
    Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.patternRow}>
        {PATTERNS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.patternChip, patternId === p.id && styles.patternChipActive]}
            onPress={() => {
              if (running) return;
              setPatternId(p.id);
              setPhaseIdx(0);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.patternText, patternId === p.id && styles.patternTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.circleWrap}>
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
          <Text style={styles.phaseLabel}>{running ? phase.label : 'Ready when you are'}</Text>
          {running && <Text style={styles.phaseSecs}>{phase.secs}s</Text>}
        </Animated.View>
      </View>

      <Text style={styles.cycles}>
        {running ? `Quiet breath ${cycles + 1} · no rush` : 'Pick a rhythm, then just follow the circle.'}
      </Text>

      <TouchableOpacity
        style={[styles.mainBtn, running && styles.stopBtn]}
        onPress={running ? stop : start}
        activeOpacity={0.8}
      >
        <Text style={styles.mainBtnText}>{running ? 'PAUSE' : 'BEGIN'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  patternRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 },
  patternChip: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  patternChipActive: { backgroundColor: Colors.accentSoft, borderColor: 'rgba(143,216,181,0.5)' },
  patternText: { color: Colors.textMuted, fontSize: 14, fontWeight: '700' },
  patternTextActive: { color: Colors.accent },
  circleWrap: { height: 260, alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: Colors.accentSoft,
    borderWidth: 2,
    borderColor: 'rgba(143,216,181,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: { color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', paddingHorizontal: 12 },
  phaseSecs: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
  cycles: { color: Colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  mainBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingHorizontal: 48,
    paddingVertical: 16,
    alignItems: 'center',
  },
  stopBtn: { backgroundColor: 'rgba(255,255,255,0.16)' },
  mainBtnText: { color: '#0B1120', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
});
