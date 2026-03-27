import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { useGameStore } from '../../src/store/gameStore';
import { usePlayerStore } from '../../src/stores/playerStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { supabase } from '../../src/lib/supabase';
import { Colors, Spacing, Typography } from '../../src/theme';
import { removeAllChannels } from '../../src/lib/channelCleanup';

/**
 * Waiting screen — shown to late joiners who arrive during qm_active status.
 * They wait here until the answer phase begins, then navigate to answer-phase.
 */
export default function WaitingScreen() {
  const router = useRouter();
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const setAnswerPhaseStartedAt = useGameStore((s) => s.setAnswerPhaseStartedAt);
  const { room_code } = usePlayerStore();

  // Fetch current players if not yet loaded
  useEffect(() => {
    const loadPlayers = async () => {
      if (players.length === 0 && room_code) {
        const { data: roomPlayers } = await supabase
          .from('room_players')
          .select('player_id, display_name, is_host')
          .eq('room_id', usePlayerStore.getState().room_id)
          .eq('is_kicked', false)

        if (roomPlayers && roomPlayers.length > 0) {
          // Update game store players list for display
          useGameStore.getState().initGame(
            roomPlayers.map((p) => ({
              id: p.player_id,
              displayName: p.display_name,
              isHost: p.is_host,
            })),
            usePlayerStore.getState().player_id ?? '',
            room_code
          )
        }
      }
    }
    loadPlayers()
  }, [])

  useGameChannel(roomCode ?? room_code ?? '', {
    onGameEnded: () => {
      removeAllChannels();
      usePlayerStore.getState().clearRoom();
      router.replace('/');
    },
    onQMReady: ({ answerPhaseStartedAt }) => {
      if (answerPhaseStartedAt) setAnswerPhaseStartedAt(answerPhaseStartedAt)
      router.replace('/(game)/answer-phase');
    },
    onRoundStarted: () => {
      router.replace('/(game)/leaderboard');
    },
    // Round timer expired — skip to leaderboard (late joiner wasn't eligible to answer)
    onRoundExpired: () => {
      router.replace('/(game)/leaderboard');
    },
  });

  return (
    <ScreenContainer centered>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.title}>A round is in progress</Text>
        <Text style={styles.subtitle}>You'll join the action shortly...</Text>

        {players.length > 0 && (
          <View style={styles.playerList}>
            <Text style={styles.listLabel}>CURRENTLY PLAYING</Text>
            {players.map((p) => (
              <Text key={p.id} style={styles.playerName}>{p.displayName}</Text>
            ))}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    ...Typography.heading,
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  playerList: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  listLabel: {
    ...Typography.label,
    color: Colors.muted,
  },
  playerName: {
    ...Typography.body,
    color: Colors.white,
  },
});
