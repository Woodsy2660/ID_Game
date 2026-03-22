import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { PlayerScoreCard } from '../../src/components/game/PlayerScoreCard';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { usePlayerStore } from '../../src/stores/playerStore';
import { supabase } from '../../src/lib/supabase';
import { Colors, Spacing, Typography } from '../../src/theme';

/**
 * Leaderboard screen — shows cumulative scores after each round.
 *
 * Host taps "Next Round" → calls start-round edge function → broadcasts
 * round:started to all clients → everyone navigates to round-start.
 *
 * Non-hosts see "Waiting for host..." and navigate when the broadcast arrives.
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
  const roomCode = useGameStore((s) => s.roomCode);
  const setNextRound = useGameStore((s) => s.setNextRound);
  const nextRound = useGameStore((s) => s.nextRound);
  const getNextQMPlayer = useGameStore((s) => s.getNextQMPlayer);

  const { room_id } = usePlayerStore();
  const isDevMode = roomCode?.startsWith('DEV');

  const isHost = isDevMode || (players.find((p) => p.id === localPlayerId)?.isHost ?? false);

  const [loading, setLoading] = useState(false);

  // All clients (including the host) navigate when they receive the broadcast.
  // This ensures everyone transitions at the same time.
  useGameChannel(roomCode ?? '', {
    onRoundStarted: (payload) => {
      setNextRound(payload);
      router.replace('/(game)/round-start');
    },
  });

  const handleNextRound = async () => {
    // Dev mode: skip Supabase, advance locally
    if (isDevMode) {
      nextRound();
      router.replace('/(game)/round-start');
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.functions.invoke('start-round', {
      body: { room_id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    // Navigation happens in the onRoundStarted handler above, not here,
    // so the host and all other clients transition simultaneously.
    setLoading(false);
  };

  // Sort players by score descending
  const ranked = [...players]
    .map((p) => ({ ...p, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const nextQM = getNextQMPlayer();

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
        {isHost ? (
          <Button
            title={loading ? 'Starting...' : 'Next Round'}
            onPress={handleNextRound}
            disabled={loading}
          />
        ) : (
          <Text style={styles.waiting}>Waiting for host to start next round...</Text>
        )}
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
    color: Colors.primary,
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
  waiting: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
});
