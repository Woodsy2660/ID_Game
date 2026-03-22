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
  qmName,
}: {
  isCorrect: boolean;
  questionText: string;
  qmName: string;
}) {
  const bgColor = isCorrect ? Colors.success : (Colors.error || '#EF4444');
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
  qmHeader: {
    ...Typography.heading,
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    fontSize: 22,
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
    gap: Spacing.xl,
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
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
