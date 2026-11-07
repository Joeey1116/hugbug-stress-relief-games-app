import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

type ShapeKind = 'circle' | 'square' | 'triangle';
const SHAPES: { kind: ShapeKind; icon: string; color: string }[] = [
  { kind: 'circle', icon: 'ellipse', color: '#8FD8B5' },
  { kind: 'circle', icon: 'ellipse-outline', color: '#9CC8E8' },
  { kind: 'square', icon: 'square', color: '#F2D492' },
  { kind: 'square', icon: 'square-outline', color: '#F2B8A0' },
  { kind: 'triangle', icon: 'triangle', color: '#B9A8E8' },
  { kind: 'triangle', icon: 'triangle-outline', color: '#8FD8B5' },
];

const BINS: { kind: ShapeKind; label: string; icon: string; color: string }[] = [
  { kind: 'circle', label: 'Round', icon: 'ellipse', color: '#8FD8B5' },
  { kind: 'square', label: 'Square', icon: 'square', color: '#F2D492' },
  { kind: 'triangle', label: 'Pointy', icon: 'triangle', color: '#B9A8E8' },
];

/** Shape Sort — sort shapes at your own pace. A wrong bin just waits. */
export default function ShapeSortGame() {
  const [remaining, setRemaining] = useState<number[]>(() => SHAPES.map((_, i) => i));
  const [selected, setSelected] = useState<number | null>(null);
  const [sorted, setSorted] = useState<Record<ShapeKind, number>>({ circle: 0, square: 0, triangle: 0 });
  const [note, setNote] = useState('Tap a shape, then tap the bin it belongs in.');

  const place = (bin: ShapeKind) => {
    if (selected === null) {
      setNote('Tap a shape first — then its bin.');
      return;
    }
    const shape = SHAPES[selected];
    if (shape.kind === bin) {
      void playSound('chime');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRemaining((r) => r.filter((i) => i !== selected));
      setSorted((s) => ({ ...s, [bin]: s[bin] + 1 }));
      setSelected(null);
      setNote('That one fits. Lovely.');
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNote('Not quite — that shape lives in another bin. No harm done, try again.');
    }
  };

  const done = remaining.length === 0;
  const reset = () => {
    setRemaining(SHAPES.map((_, i) => i));
    setSelected(null);
    setSorted({ circle: 0, square: 0, triangle: 0 });
    setNote('Tap a shape, then tap the bin it belongs in.');
  };

  return (
    <GameShell gameId="shape-sort" title="Shape Sort" subtitle="Sort the shapes into their bins. There is no wrong move that costs you anything.">
      <View style={styles.tray}>
        {remaining.map((i) => {
          const s = SHAPES[i];
          return (
            <TouchableOpacity
              key={i}
              style={[styles.shape, selected === i && { borderColor: s.color, backgroundColor: `${s.color}22` }]}
              onPress={() => {
                setSelected(i);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name={s.icon as any} size={36} color={s.color} />
            </TouchableOpacity>
          );
        })}
        {remaining.length === 0 && <Text style={styles.emptyTray}>All sorted.</Text>}
      </View>

      <View style={styles.bins}>
        {BINS.map((b) => (
          <TouchableOpacity key={b.kind} style={[styles.bin, { borderColor: `${b.color}66` }]} onPress={() => place(b.kind)} activeOpacity={0.85}>
            <Ionicons name={b.icon as any} size={28} color={b.color} />
            <Text style={styles.binLabel}>{b.label}</Text>
            <Text style={styles.binCount}>{sorted[b.kind]} in</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>{done ? 'Every shape home. Take a breath.' : note}</Text>
      {done && (
        <TouchableOpacity style={styles.again} onPress={reset} activeOpacity={0.8}>
          <Text style={styles.againText}>SORT AGAIN</Text>
        </TouchableOpacity>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    minHeight: 96,
    paddingTop: 12,
  },
  shape: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTray: { color: Colors.accent, fontSize: 16, fontWeight: '700', alignSelf: 'center' },
  bins: { flexDirection: 'row', gap: 12, marginTop: 28 },
  bin: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 18,
    backgroundColor: Colors.card,
    paddingVertical: 20,
    alignItems: 'center',
  },
  binLabel: { color: Colors.text, fontSize: 15, fontWeight: '800', marginTop: 8 },
  binCount: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  note: { color: Colors.textSoft, fontSize: 15, textAlign: 'center', marginTop: 26, lineHeight: 22, paddingHorizontal: 8 },
  again: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 48,
  },
  againText: { color: '#0B1120', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});
