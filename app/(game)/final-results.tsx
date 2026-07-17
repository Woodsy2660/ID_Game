import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LeaderboardIDCard } from '../../src/components/game/LeaderboardIDCard';
import { LeaderboardCompactRow } from '../../src/components/game/LeaderboardCompactRow';
import { ScrollFadeOverlay } from '../../src/components/ui/ScrollFadeOverlay';
import { useScrollFades } from '../../src/hooks/useScrollFades';
import { useGameStore } from '../../src/store/gameStore';
import { usePlayerStore } from '../../src/store/playerStore';
import { removeAllChannels } from '../../src/lib/channelCleanup';
import { Colors, Spacing, Typography, Mono } from '../../src/theme';

/**
 * Final Results / Game Over — the closing ceremony after the host ends the game.
 * Crowns the winner as a hero ID card, shows the full final standings, then
 * returns everyone home. Reads the final scores straight from the game store.
 */
export default function FinalResultsScreen() {
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const scores = useGameStore((s) => s.scores);
  const resetGame = useGameStore((s) => s.resetGame);
  const clearRoom = usePlayerStore((s) => s.clearRoom);

  const { showTopFade, showBottomFade, scrollHandler, onContentSizeChange, onLayout } =
    useScrollFades();

  // The room is over — drop realtime subscriptions on entry.
  useEffect(() => {
    removeAllChannels();
  }, []);

  const ranked = [...players]
    .map((p) => ({ ...p, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const winner = ranked[0];
  const runnersUp = ranked.slice(1, 3);
  const rest = ranked.slice(3);
  const topScore = winner?.score ?? 0;
  // A draw at the top is possible — reflect it honestly rather than crowning one.
  const isDraw = ranked.filter((p) => p.score === topScore).length > 1 && topScore > 0;

  const handleHome = () => {
    removeAllChannels();
    resetGame();
    clearRoom();
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.kicker}>GAME OVER</Text>
          <Text style={styles.title}>{isDraw ? "It's a draw!" : 'Champion'}</Text>
        </Animated.View>

        <View style={styles.listWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onContentSizeChange={onContentSizeChange}
            onLayout={onLayout}
          >
            {winner && (
              <LeaderboardIDCard
                rank={1}
                playerName={winner.displayName}
                score={winner.score}
                delay={120}
                size="large"
              />
            )}

            {runnersUp.length > 0 && (
              <View style={styles.runnersRow}>
                {runnersUp.map((p, i) => (
                  <View key={p.id} style={styles.runnerCol}>
                    <LeaderboardIDCard
                      rank={(i + 2) as 2 | 3}
                      playerName={p.displayName}
                      score={p.score}
                      delay={260 + i * 100}
                    />
                  </View>
                ))}
              </View>
            )}

            {rest.length > 0 && (
              <View style={styles.restList}>
                {rest.map((p, i) => (
                  <LeaderboardCompactRow
                    key={p.id}
                    rank={i + 4}
                    playerName={p.displayName}
                    score={p.score}
                    delay={460 + i * 70}
                  />
                ))}
              </View>
            )}
          </ScrollView>
          <ScrollFadeOverlay showTop={showTopFade} showBottom={showBottomFade} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.thanks}>Thanks for playing 🪪</Text>
          <Pressable
            onPress={handleHome}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 8, gap: 4 },
  kicker: {
    fontFamily: Mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    color: Colors.inkSoft,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  listWrapper: { flex: 1, position: 'relative' },
  scrollContent: { paddingVertical: 8, gap: 12 },
  runnersRow: { flexDirection: 'row', gap: 10 },
  runnerCol: { flex: 1 },
  restList: { gap: 8, marginTop: 4 },
  footer: { paddingTop: 16, gap: 12, alignItems: 'center' },
  thanks: { ...Typography.body, color: Colors.inkSoft },
  cta: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: Colors.primaryEdge,
  },
  ctaPressed: { transform: [{ translateY: 2 }], opacity: 0.94 },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
