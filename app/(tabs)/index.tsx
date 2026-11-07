import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../components/GlassCard';
import { GameCard } from '../../components/GameCard';
import { CATEGORIES, MOODS, type Mood } from '../../lib/games/types';
import { GAMES, gamesForCategory, gamesForMood } from '../../lib/games/registry';
import { Colors } from '../../lib/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

/** Home — greeting, hero breathing card, mood chips, category rails. */
export default function Home() {
  const [mood, setMood] = useState<Mood | null>(null);

  const suggested = mood ? gamesForMood(mood) : [];
  const moodBlurb = mood ? MOODS.find((m) => m.id === mood)?.blurb : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>CALM GAMES</Text>
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greet}>{greeting()}</Text>
            <Text style={styles.greetSub}>ready to slow down?</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/you')} activeOpacity={0.8}>
            <Ionicons name="person" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Hero breathing card */}
        <GlassCard style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.breathCircle}>
              <View style={styles.breathInner} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Take a breath</Text>
              <Text style={styles.heroSub}>Breathe in, breathe out —{'\n'}4 quiet minutes</Text>
              <TouchableOpacity style={styles.beginBtn} onPress={() => router.push('/(tabs)/breathe')} activeOpacity={0.8}>
                <Text style={styles.beginText}>Begin →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        {/* Mood prompt */}
        <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
        <View style={styles.chips}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, mood === m.id && styles.chipActive]}
              onPress={() => setMood(mood === m.id ? null : m.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, mood === m.id && styles.chipTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mood && (
          <View style={styles.suggested}>
            <Text style={styles.suggestedBlurb}>{moodBlurb}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {suggested.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category rails */}
        {CATEGORIES.filter((c) => c.id !== 'breathe').map((cat) => {
          const games = gamesForCategory(cat.id);
          if (games.length === 0) return null;
          return (
            <View key={cat.id} style={styles.railBlock}>
              <View style={styles.railHeader}>
                <Text style={styles.railTitle}>{cat.label}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/games', params: { category: cat.id } } as any)} activeOpacity={0.7}>
                  <Text style={styles.seeAll}>See all →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
                {games.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </ScrollView>
            </View>
          );
        })}

        <Text style={styles.footer}>No timers • No losing • No ads</Text>
        <Text style={styles.footerSub}>{GAMES.length} calm games in your library — and growing.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 },
  kicker: { color: Colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  greet: { color: Colors.text, fontSize: 32, fontWeight: '800', letterSpacing: 0.5 },
  greetSub: { color: Colors.textMuted, fontSize: 26, fontWeight: '700', marginTop: 2 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { padding: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  breathCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  breathInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.accent },
  heroText: { flex: 1 },
  heroTitle: { color: Colors.text, fontSize: 24, fontWeight: '800' },
  heroSub: { color: Colors.textSoft, fontSize: 15, lineHeight: 21, marginTop: 6 },
  beginBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  beginText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: Colors.text, fontSize: 22, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  chipActive: { backgroundColor: Colors.accentSoft, borderColor: 'rgba(143,216,181,0.5)' },
  chipText: { color: Colors.textSoft, fontSize: 15, fontWeight: '700' },
  chipTextActive: { color: Colors.accent },
  suggested: { marginTop: 18 },
  suggestedBlurb: { color: Colors.textMuted, fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  railBlock: { marginTop: 24 },
  railHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  railTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  seeAll: { color: Colors.textMuted, fontSize: 14, fontWeight: '700' },
  railContent: { paddingRight: 8 },
  footer: { color: Colors.textMuted, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 32 },
  footerSub: { color: '#5A6478', fontSize: 13, textAlign: 'center', marginTop: 6 },
});
