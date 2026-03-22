import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '../src/store/gameStore';
import { Colors, Spacing, Typography, Radius } from '../src/theme';
import type { Player } from '../src/store/types';

/**
 * DEV-ONLY test entry point — not part of the production flow.
 * Access at route /dev (e.g. type "dev" in Expo Go's URL bar, or navigate via router.push('/dev')).
 *
 * Preloads 4 players into gameStore and shows a lobby-style screen.
 * "Start Game" calls initGame() and pushes into the real game loop.
 * No Supabase connection required.
 */

const MOCK_PLAYERS: Player[] = [
  { id: 'p1', displayName: 'Tyler',  isHost: true  },
  { id: 'p2', displayName: 'Woodsy', isHost: false },
  { id: 'p3', displayName: 'Digby',  isHost: false },
  { id: 'p4', displayName: 'Luke',   isHost: false },
  { id: 'p5', displayName: 'Rozza',  isHost: false },
];

const LOCAL_PLAYER_ID = 'p1'; // Tyler is the host on this device

export default function DevLobby() {
  const router = useRouter();
  const initGame = useGameStore((s) => s.initGame);
  const [started, setStarted] = useState(false);

  const handleStartGame = () => {
    setStarted(true);
    // initGame without initialRound → client-side question/QM selection (fine for testing)
    initGame(MOCK_PLAYERS, LOCAL_PLAYER_ID, 'DEV000');
    router.replace('/(game)/round-start');
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.devBadge}>DEV MODE</Text>
        <Text style={styles.title}>Test Lobby</Text>
        <Text style={styles.roomCode}>DEV000</Text>
        <Text style={styles.hint}>Bypasses Supabase — tests game loop only</Text>
      </View>

      {/* Player list */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        <Text style={styles.sectionLabel}>PLAYERS ({MOCK_PLAYERS.length})</Text>
        {MOCK_PLAYERS.map((p) => {
          const isLocal = p.id === LOCAL_PLAYER_ID;
          return (
            <View key={p.id} style={[styles.playerRow, isLocal && styles.playerRowLocal]}>
              <View style={styles.playerLeft}>
                <View style={[styles.dot, isLocal && styles.dotLocal]} />
                <Text style={[styles.playerName, isLocal && styles.playerNameLocal]}>
                  {p.displayName}
                </Text>
              </View>
              <View style={styles.badges}>
                {p.isHost && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>HOST</Text>
                  </View>
                )}
                {isLocal && (
                  <View style={[styles.badge, styles.badgeYou]}>
                    <Text style={styles.badgeText}>YOU</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, started && styles.startButtonDisabled]}
          onPress={handleStartGame}
          disabled={started}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            {started ? 'Starting...' : 'Start Game'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  devBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.display,
    color: Colors.white,
  },
  roomCode: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    color: Colors.primary,
  },
  hint: {
    ...Typography.label,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  list: {
    padding: Spacing['2xl'],
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  playerRowLocal: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.muted,
  },
  dotLocal: {
    backgroundColor: Colors.primary,
  },
  playerName: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  playerNameLocal: {
    color: Colors.primary,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.raised,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeYou: {
    backgroundColor: Colors.primaryMuted,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1,
  },
  footer: {
    padding: Spacing['2xl'],
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 0.5,
  },
});
