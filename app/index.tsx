import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Button } from '../src/components/ui/Button';
import { Logo } from '../src/components/ui/Logo';
import { useGameStore } from '../src/store/gameStore';
import { Colors, Spacing, Typography, Radius } from '../src/theme';
import type { Player } from '../src/store/types';

/**
 * Dev entry point — simulates lobby handoff by initialising mock players
 * and routing into the game flow.
 *
 * In production, this screen is replaced by the auth/lobby flow.
 */

const MOCK_PLAYERS: Player[] = [
  { id: 'p1', displayName: 'Tyler', isHost: true },
  { id: 'p2', displayName: 'Woodsy', isHost: false },
  { id: 'p3', displayName: 'Digby', isHost: false },
  { id: 'p4', displayName: 'Luke', isHost: false },
  { id: 'p5', displayName: 'Rozza', isHost: false },
];

const LOCAL_PLAYER_ID = 'p1';

export default function DevEntry() {
  const router = useRouter();
  const initGame = useGameStore((s) => s.initGame);

  const handleStart = () => {
    initGame(MOCK_PLAYERS, LOCAL_PLAYER_ID, 'DEV42');
    router.replace('/(game)/round-start');
  };

  return (
    <ScreenContainer centered>
      <View style={styles.content}>
        <Logo size="large" />

        <View style={styles.playerList}>
          <Text style={styles.label}>PLAYERS</Text>
          {MOCK_PLAYERS.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <View style={[styles.playerDot, p.id === LOCAL_PLAYER_ID && styles.playerDotLocal]} />
              <Text style={styles.playerName}>
                {p.displayName}
                {p.id === LOCAL_PLAYER_ID ? ' (You)' : ''}
              </Text>
            </View>
          ))}
        </View>

        <Button title="Start Game" onPress={handleStart} />
        <Text style={styles.hint}>Room: DEV42</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: Spacing['2xl'],
    width: '100%',
  },
  playerList: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
    color: Colors.muted,
    marginBottom: Spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.muted,
  },
  playerDotLocal: {
    backgroundColor: Colors.primary,
  },
  playerName: {
    ...Typography.body,
    color: Colors.white,
  },
  hint: {
    ...Typography.label,
    color: Colors.muted,
  },
});
