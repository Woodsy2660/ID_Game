import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { PlayerScoreCard } from '../../src/components/game/PlayerScoreCard';
import { useGameStore } from '../../src/store/gameStore';
import { Colors, Spacing, Typography } from '../../src/theme';

/**
 * Leaderboard screen — shows cumulative scores, then starts the next round.
 *
 * State machine: leaderboard → round_start (next round)
 */
export default function LeaderboardScreen() {
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const scores = useGameStore((s) => s.scores);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);
  const currentRound = useGameStore((s) => s.currentRound);
  const nextRound = useGameStore((s) => s.nextRound);
  const getNextQMPlayer = useGameStore((s) => s.getNextQMPlayer);

  // Sort players by score descending
  const ranked = [...players]
    .map((p) => ({ ...p, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const nextQM = getNextQMPlayer();

  const handleNextRound = () => {
    nextRound(); // increments round, calls startRound(), sets phase to round_start
    router.replace('/(game)/round-start');
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.roundInfo}>After Round {currentRound + 1}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {ranked.map((p, i) => (
          <PlayerScoreCard
            key={p.id}
            rank={i + 1}
            playerName={p.displayName}
            score={p.score}
            isLocal={p.id === localPlayerId}
            isQM={p.id === qmPlayerId}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {nextQM && (
          <Text style={styles.nextQM}>
            Next QM: {nextQM.displayName}
          </Text>
        )}
        <Button title="Next Round" onPress={handleNextRound} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.display,
    color: Colors.amber,
  },
  roundInfo: {
    ...Typography.label,
    color: Colors.muted,
  },
  scroll: {
    flex: 1,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  footer: {
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  nextQM: {
    ...Typography.body,
    color: Colors.muted,
  },
});
