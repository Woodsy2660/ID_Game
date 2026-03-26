import React, { useEffect } from 'react';
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
import { usePlayerStore } from '../../src/stores/playerStore';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import questionBank from '../../src/data/questionBank.json';

/**
 * Round Results screen — role-aware, automatic transition.
 */
export default function RoundResultsScreen() {
  const router = useRouter();
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const isQM = useGameStore((s) => s.isQM);
  const players = useGameStore((s) => s.players);
  const roundResults = useGameStore((s) => s.roundResults);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const roomCode = useGameStore((s) => s.roomCode);

  useGameChannel(roomCode ?? '', {
    onGameEnded: () => {
      usePlayerStore.getState().clearRoom();
      router.replace('/');
    },
  });

  const qmPlayer = players.find((p) => p.id === qmPlayerId);
  const latestResult = roundResults[roundResults.length - 1];
  const question = questionBank.find((q) => q.id === latestResult?.questionId);

  // Determine if local player was correct
  const myAnswer = latestResult?.answers.find((a) => a.playerId === localPlayerId);
  const isCorrect = myAnswer?.isCorrect ?? false;

  const navigateToLeaderboard = () => {
    advancePhase(); // round_results → leaderboard
    router.replace('/(game)/leaderboard');
  };

  // Auto-advance after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(navigateToLeaderboard, 3500);
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
          <Text style={styles.qmHeader}>WHO GUESSED CORRECTLY?</Text>
          {latestResult && (
            <ResultSplash
              questionId={latestResult.questionId}
              qmName={qmPlayer?.displayName ?? '???'}
              answers={latestResult.answers}
              players={players}
            />
          )}
        </ScrollView>
        <View style={styles.footer}>
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

function AnswererResultView({
  isCorrect,
  questionText,
}: {
  isCorrect: boolean;
  questionText: string;
  qmName: string;
}) {
  const bgColor = isCorrect ? Colors.success : (Colors.error || '#EF4444');
  const resultLabel = isCorrect ? 'Correct' : 'Incorrect';
  const icon = isCorrect ? '✓' : '✕';
  const scoreLabel = isCorrect ? '+1 point' : 'No points this round';

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const iconScale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 350 });
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
    iconScale.value = withSpring(1, { damping: 10, stiffness: 120 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <SafeAreaView style={[styles.resultSafe, { backgroundColor: bgColor }]}>
      <Animated.View style={[styles.resultContent, animStyle]}>
        {/* Big icon + title */}
        <View style={styles.resultTop}>
          <Animated.Text style={[styles.resultIcon, iconAnimStyle]}>{icon}</Animated.Text>
          <Text style={styles.resultLabel}>{resultLabel}</Text>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
        </View>

        {/* Question reveal card */}
        <View style={styles.questionReveal}>
          <Text style={styles.revealHeading}>THE QUESTION WAS</Text>
          <Text style={styles.revealQuestion}>{questionText}</Text>
        </View>
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
    paddingBottom: Spacing['4xl'],
  },
  qmHeader: {
    ...Typography.heading,
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  autoAdvanceHint: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    fontSize: 12,
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
    gap: 32,
  },
  resultTop: {
    alignItems: 'center',
    gap: 8,
  },
  resultIcon: {
    fontSize: 72,
    fontWeight: '900',
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 80,
    marginBottom: 4,
  },
  resultLabel: {
    ...Typography.display,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    color: Colors.black,
    textAlign: 'center',
  },
  scoreLabel: {
    ...Typography.label,
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'center',
    marginTop: 4,
  },
  questionReveal: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: Radius.lg,
    padding: 24,
    gap: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  revealHeading: {
    ...Typography.label,
    color: 'rgba(0,0,0,0.5)',
  },
  revealQuestion: {
    ...Typography.heading,
    color: Colors.black,
    textAlign: 'center',
  },
});
