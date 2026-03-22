import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { ResultSplash } from '../../src/components/game/ResultSplash';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import questionBank from '../../src/data/questionBank.json';

const AUTO_ADVANCE_MS = 3000;

/**
 * Round Results screen — role-aware, no manual button.
 *
 * QM view:       ResultSplash showing every player's correct/wrong result.
 * Answerer view: Personal full-screen correct (green) or wrong (red) splash.
 *
 * After AUTO_ADVANCE_MS the first device to fire broadcasts leaderboard:ready
 * so everyone navigates to the leaderboard at the same time.
 *
 * State machine: round_results → leaderboard
 */
export default function RoundResultsScreen() {
  const router = useRouter();
  const isQM = useGameStore((s) => s.isQM);
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const roundResults = useGameStore((s) => s.roundResults);
  const advancePhase = useGameStore((s) => s.advancePhase);

  const qmPlayer = players.find((p) => p.id === qmPlayerId);
  const latestResult = roundResults[roundResults.length - 1];
  const myAnswer = latestResult?.answers.find((a) => a.playerId === localPlayerId);
  const isCorrect = myAnswer?.isCorrect ?? false;
  const question = questionBank.find((q) => q.id === latestResult?.questionId);

  // Guard against double-navigation
  const transitionedRef = useRef(false);
  // Holds broadcastLeaderboardReady after useGameChannel initialises it
  const broadcastLeaderboardReadyRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Navigate to leaderboard.
   * Called from the 3-second timer AND from the onLeaderboardReady broadcast handler.
   * Whichever fires first wins; transitionedRef blocks the duplicate.
   */
  const navigateToLeaderboard = () => {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    // Tell other devices it's time to go (fire-and-forget)
    broadcastLeaderboardReadyRef.current?.();
    advancePhase(); // round_results → leaderboard
    router.replace('/(game)/leaderboard');
  };

  const { broadcastLeaderboardReady } = useGameChannel(roomCode ?? '', {
    onLeaderboardReady: navigateToLeaderboard,
  });
  // Assign after useGameChannel so navigateToLeaderboard can call it via ref
  broadcastLeaderboardReadyRef.current = broadcastLeaderboardReady;

  // Auto-advance after 3 seconds. All devices start this timer when they arrive
  // on this screen (within broadcast latency of each other). The leaderboard:ready
  // broadcast keeps the straggler in sync if one device's timer fires slightly later.
  useEffect(() => {
    const timer = setTimeout(navigateToLeaderboard, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, []);

  // ─── QM view: shows all player results ───────────────────────────────────
  if (isQM()) {
    return (
      <ScreenContainer>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {latestResult && (
            <ResultSplash
              questionId={latestResult.questionId}
              qmName={qmPlayer?.displayName ?? '???'}
              answers={latestResult.answers}
              players={players}
            />
          )}
        </ScrollView>
        <View style={styles.qmFooter}>
          <Text style={styles.autoAdvanceHint}>Heading to leaderboard...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Answerer view: personal correct / wrong splash ───────────────────────
  return (
    <AnswererResultView
      isCorrect={isCorrect}
      questionText={question?.text ?? ''}
      qmName={qmPlayer?.displayName ?? '???'}
    />
  );
}

// Separate component so animation hooks always run at the top level
function AnswererResultView({
  isCorrect,
  questionText,
  qmName,
}: {
  isCorrect: boolean;
  questionText: string;
  qmName: string;
}) {
  const bgColor = isCorrect ? Colors.tertiary : Colors.error;
  const icon = isCorrect ? '✓' : '✗';
  const resultLabel = isCorrect ? 'Correct!' : 'Wrong!';
  const scoreLabel = isCorrect ? '+1 point' : 'No points this round';

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 350 });
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaView style={[styles.resultSafe, { backgroundColor: bgColor }]}>
      <Animated.View style={[styles.resultContent, animStyle]}>

        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <Text style={styles.resultLabel}>{resultLabel}</Text>
        <Text style={styles.scoreLabel}>{scoreLabel}</Text>

        <View style={styles.questionReveal}>
          <Text style={styles.revealHeading}>THE QUESTION WAS</Text>
          <Text style={styles.revealQuestion}>{questionText}</Text>
          <Text style={styles.revealHint}>Asked about {qmName}</Text>
        </View>

        <Text style={styles.autoAdvanceHintDark}>Heading to leaderboard...</Text>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // QM layout
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  qmFooter: {
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  autoAdvanceHint: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },

  // Answerer result
  resultSafe: {
    flex: 1,
  },
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.black,
  },
  resultLabel: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.black,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  questionReveal: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    gap: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  revealHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(0,0,0,0.5)',
  },
  revealQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 24,
  },
  revealHint: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  autoAdvanceHintDark: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
