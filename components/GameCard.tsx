import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { GameEntry } from '../lib/games/types';
import { Colors } from '../lib/theme';

/** One game card — used on the Home rails and the Games browse screen. */
export function GameCard({ game, wide }: { game: GameEntry; wide?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.card, wide ? styles.wide : styles.rail]}
      onPress={() => router.push(`/game/${game.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconTile, { backgroundColor: `${game.color}26` }]}>
        <Ionicons name={game.icon as any} size={26} color={game.color} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {game.name}
      </Text>
      <Text style={styles.tagline} numberOfLines={2}>
        {game.tagline}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    padding: 16,
  },
  rail: { width: 168, marginRight: 12 },
  wide: { flex: 1, minHeight: 132 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  tagline: { color: Colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 },
});
