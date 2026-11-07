import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '../../components/GameShell';
import { useAuth } from '../../lib/auth';
import { loadProgress, tendGarden, resetGardenPlot, type ProgressState } from '../../lib/progress';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

const PLOTS = [0, 1, 2, 3, 4, 5];
const STAGE_LABEL = ['Empty soil', 'Seed planted', 'Sprouting', 'Blooming'];
const STAGE_ICON = ['ellipse-outline', 'ellipse', 'leaf', 'flower'] as const;
const STAGE_COLOR = ['#5A6478', '#9CC8E8', '#8FD8B5', '#F2D492'];

/**
 * Calm Garden — tend a little garden each day. The strongest daily-habit
 * loop in the hub, but the first session pays off immediately: the first
 * tap plants a seed that sprouts right away, not on day 7.
 */
export default function CalmGardenGame() {
  const { userId } = useAuth();
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    void loadProgress(userId).then(setProgress);
  }, [userId]);

  const tend = async (plot: number) => {
    const current = progress?.garden[String(plot)] ?? 0;
    if (current >= 3) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void playSound(current === 0 ? 'ripple' : 'chime');
    const { state } = await tendGarden(userId, plot);
    setProgress(state);
  };

  const harvest = async (plot: number) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void playSound('complete');
    const state = await resetGardenPlot(userId, plot);
    setProgress(state);
  };

  const blooms = PLOTS.filter((p) => (progress?.garden[String(p)] ?? 0) === 3).length;

  return (
    <GameShell gameId="calm-garden" title="Calm Garden" subtitle="Tap a plot to plant, then water it and watch it grow. Come back tomorrow — it will still be here, waiting kindly.">
      <View style={styles.grid}>
        {PLOTS.map((plot) => {
          const stage = progress?.garden[String(plot)] ?? 0;
          return (
            <TouchableOpacity
              key={plot}
              style={[styles.plot, stage === 3 && styles.plotBloom]}
              onPress={() => tend(plot)}
              activeOpacity={0.85}
            >
              <Ionicons name={STAGE_ICON[stage] as any} size={40} color={STAGE_COLOR[stage]} />
              <Text style={styles.plotLabel}>{STAGE_LABEL[stage]}</Text>
              {stage === 3 && (
                <TouchableOpacity style={styles.harvest} onPress={() => harvest(plot)} activeOpacity={0.8}>
                  <Text style={styles.harvestText}>Pick & replant</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.status}>
        {blooms === 0
          ? 'Tap any plot to plant your first seed — it sprouts right away.'
          : blooms === PLOTS.length
            ? 'The whole garden is blooming. Beautiful.'
            : `${blooms} bloom${blooms === 1 ? '' : 's'} in your garden. It grows a little every visit.`}
      </Text>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingTop: 12 },
  plot: {
    width: '47%',
    borderRadius: 20,
    backgroundColor: 'rgba(143,216,181,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(143,216,181,0.3)',
    paddingVertical: 22,
    alignItems: 'center',
  },
  plotBloom: { backgroundColor: 'rgba(242,212,146,0.12)', borderColor: 'rgba(242,212,146,0.5)' },
  plotLabel: { color: Colors.textSoft, fontSize: 13, fontWeight: '700', marginTop: 10 },
  harvest: { marginTop: 10, backgroundColor: Colors.accentSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  harvestText: { color: Colors.accent, fontSize: 12, fontWeight: '800' },
  status: { color: Colors.textSoft, fontSize: 15, textAlign: 'center', marginTop: 26, lineHeight: 22, paddingHorizontal: 8 },
});
