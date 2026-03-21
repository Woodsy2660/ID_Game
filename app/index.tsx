import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Button } from '../src/components/ui/Button';
import { useGameStore } from '../src/store/gameStore';
import { Colors, Spacing, Typography } from '../src/theme';
import type { Player } from '../src/store/types';

/**
 * Dev entry point — simulates lobby handoff by initialising mock players
 * and routing into the game flow.
 *
 * In production, this screen is replaced by the auth/lobby flow.
 * The lobby calls initGame() and then navigates to /(game)/round-start.
 */

const MOCK_PLAYERS: Player[] = [
  { id: 'p1', displayName: 'Tyler', isHost: true },
  { id: 'p2', displayName: 'Jordan', isHost: false },
  { id: 'p3', displayName: 'Alex', isHost: false },
  { id: 'p4', displayName: 'Sam', isHost: false },
  { id: 'p5', displayName: 'Casey', isHost: false },
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
        <Text style={styles.title}>The ID Game</Text>
        <Text style={styles.subtitle}>Development Entry</Text>

        <View style={styles.playerList}>
          <Text style={styles.label}>MOCK PLAYERS</Text>
          {MOCK_PLAYERS.map((p) => (
            <Text key={p.id} style={styles.playerName}>
              {p.displayName}
              {p.id === LOCAL_PLAYER_ID ? ' (You)' : ''}
            </Text>
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
  title: {
    ...Typography.display,
    color: Colors.amber,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.muted,
  },
  playerList: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
    color: Colors.muted,
    marginBottom: Spacing.xs,
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
