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
import { LeaveGameButton } from '../../src/components/game/LeaveGameButton';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { usePlayerStore } from '../../src/store/playerStore';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import { ScrollFadeOverlay } from '../../src/components/ui/ScrollFadeOverlay';
import { useScrollFades } from '../../src/hooks/useScrollFades';
import { findQuestion } from '../../src/data/packs';

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
  const pack = useGameStore((s) => s.pack);

  useGameChannel(roomCode ?? '', {
    onGameEnded: () => {
      usePlayerStore.getState().clearRoom();
      router.replace('/(game)/final-results');
    },
    // QM forfeited or left mid-round — skip results, go straight to leaderboard.
    onRoundForfeited: () => {
      useGameStore.getState().forfeitRound();
      router.replace('/(game)/leaderboard');
    },
  });

  const qmPlayer = players.find((p) => p.id === qmPlayerId);
  const latestResult = roundResults[roundResults.length - 1];

  const {
    showTopFade,
    showBottomFade,
    scrollHandler,
    onContentSizeChange,
    onLayout: fadeLayout,
  } = useScrollFades();
  const question = findQuestion(pack, latestResult?.questionId ?? -1);

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
      <ScreenContainer overlay={<LeaveGameButton />}>
        <View style={styles.scrollWrapper}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onContentSizeChange={onContentSizeChange}
            onLayout={fadeLayout}
          >
            <Text style={styles.qmHeader}>WHO GUESSED CORRECTLY?</Text>
            {latestResult && (
              <ResultSplash
                questionId={latestResult.questionId}
                qmName={qmPlayer?.displayName ?? '???'}
                answers={latestResult.answers}
                players={players}
                pack={pack}
              />
            )}
          </ScrollView>
          <ScrollFadeOverlay showTop={showTopFade} showBottom={showBottomFade} />
        </View>
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
  const bgColor = isCorrect ? Colors.success : Colors.error;
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
  scrollWrapper: {
    flex: 1,
    position: 'relative',
  },
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
    fontSize: 76,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 84,
    marginBottom: 4,
  },
  resultLabel: {
    ...Typography.display,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scoreLabel: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 4,
  },
  questionReveal: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.lg,
    padding: 24,
    gap: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  revealHeading: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
  },
  revealQuestion: {
    ...Typography.heading,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
