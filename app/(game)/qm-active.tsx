import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  SlideInDown,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { SlotMachine } from '../../src/components/game/SlotMachine';
import { SecretQuestionCard } from '../../src/components/game/SecretQuestionCard';
import { IDCard } from '../../src/components/game/IDCard';
import { SubmissionTracker } from '../../src/components/game/SubmissionTracker';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import type { ResultsReadyPayload } from '../../src/hooks/useGameChannel';
import { supabase } from '../../src/lib/supabase';
import { Colors, Spacing, Typography } from '../../src/theme';
import questionBank from '../../src/data/questionBank.json';

/**
 * QM Active screen:
 * 1. Roulette wheel spins and lands on the secret question
 * 2. After 5 s the qm-ready edge fn is called automatically — answerers navigate to answer-phase
 * 3. QM stays on this screen and watches the submission tracker
 * 4. When all answerers have submitted, QM navigates to round-results
 *
 * State machine: qm_active → (answerers go to answer_phase) → round_results
 */
export default function QMActiveScreen() {
  const router = useRouter();
  const isQM = useGameStore((s) => s.isQM);
  const roomCode = useGameStore((s) => s.roomCode);
  const roundId = useGameStore((s) => s.roundId);
  const questionId = useGameStore((s) => s.questionId);
  const visibleQuestionIds = useGameStore((s) => s.visibleQuestionIds);
  const qmPlayer = useGameStore((s) => s.getQMPlayer());
  const advancePhase = useGameStore((s) => s.advancePhase);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const syncSubmissions = useGameStore((s) => s.syncSubmissions);
  const computeResults = useGameStore((s) => s.computeResults);
  const players = useGameStore((s) => s.players);
  const submissions = useGameStore((s) => s.submissions);
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);

  const [revealed, setRevealed] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  const question = questionBank.find((q) => q.id === questionId);
  const answerers = players.filter((p) => p.id !== qmPlayerId);
  const submittedCount = Object.keys(submissions).length;

  // Timer ref so we can clean up the 5 s auto-broadcast on unmount
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against navigating to round-results more than once
  const transitionedRef = useRef(false);

  // Reset local UI state when a new round begins — prevents stale data showing
  useEffect(() => {
    setRevealed(false);
    setShowTracker(false);
    transitionedRef.current = false;
  }, [roundId]);

  // Clean up the reveal timer on unmount
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const navigateToAnswerPhase = () => {
    advancePhase(); // → answer_phase
    router.replace('/(game)/answer-phase');
  };

  // QM navigates to round-results — computes results first so the store is populated
  const navigateToResults = () => {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    computeResults();
    advancePhase(); // → round_results
    router.replace('/(game)/round-results');
  };

  useGameChannel(roomCode ?? '', {
    // Answerers navigate to answer-phase when they receive this
    onQMReady: isQM() ? undefined : navigateToAnswerPhase,

    // QM tracks incoming submissions; navigates when all are in
    onAnswerSubmitted: isQM() ? ({ playerId, guessedQuestionId }) => {
      submitAnswer(playerId, guessedQuestionId);
      if (useGameStore.getState().allAnswered()) {
        navigateToResults();
      }
    } : undefined,

    // Authoritative sync: an answerer already computed all-answered and broadcast
    // the full submissions map — use it so QM scores match everyone else
    onResultsReady: isQM() ? ({ submissions: authoritative }: ResultsReadyPayload) => {
      syncSubmissions(authoritative);
      navigateToResults();
    } : undefined,
  });

  const handleRevealed = () => {
    setRevealed(true);
    if (isQM()) {
      const isDevMode = roomCode?.startsWith('DEV');
      // Give QM 5 s to read their question, then auto-open guessing for everyone
      revealTimerRef.current = setTimeout(async () => {
        if (isDevMode) {
          // Dev mode: skip Supabase edge function, just show tracker locally
          // and auto-advance answerers via navigateToAnswerPhase after mock delay
          setShowTracker(true);
        } else {
          await supabase.functions.invoke('qm-ready', {
            body: { room_code: roomCode },
          });
          setShowTracker(true);
        }
      }, 5000);
    }
  };

  // ─── QM view ──────────────────────────────────────────────────────────────
  if (isQM()) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          {!revealed && (
            <Text style={styles.label}>YOUR SECRET QUESTION</Text>
          )}

          <View style={styles.centerSection}>
            {!revealed ? (
              <SlotMachine
                questionId={questionId!}
                visibleQuestionIds={visibleQuestionIds}
                onRevealed={handleRevealed}
              />
            ) : (
              <Animated.View entering={SlideInDown} style={styles.arrangeWrapper}>
                <SecretQuestionCard
                  questionText={question?.text ?? ''}
                  qmName={qmPlayer?.displayName ?? ''}
                />

                {showTracker && (
                  <Animated.View entering={SlideInDown.delay(200)} style={styles.arrangeContainer}>
                    <Text style={styles.arrangeTitle}>ARRANGE IDs</Text>
                    <View style={styles.cardList}>
                      <Text style={styles.rankLabel}>MOST LIKELY</Text>
                      <IDCard delay={200} />
                      <IDCard delay={350} />
                      <IDCard delay={500} />
                      <Text style={styles.rankLabel}>LEAST LIKELY</Text>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </View>

          {showTracker && (
            <Animated.View entering={SlideInDown.delay(400)} style={styles.trackerArea}>
              <SubmissionTracker
                submitted={submittedCount}
                total={answerers.length}
                playerNames={answerers.map((p) => p.displayName)}
              />
            </Animated.View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // Dev mode: auto-advance answerers after 6 seconds (simulates QM reading question)
  useEffect(() => {
    if (!isQM() && roomCode?.startsWith('DEV')) {
      const timer = setTimeout(() => {
        navigateToAnswerPhase();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ─── Answerer waiting view — navigation happens via onQMReady broadcast ───
  return (
    <ScreenContainer centered>
      <View style={styles.waitContainer}>
        <View style={styles.waitDot} />
        <Text style={styles.waitTitle}>
          {qmPlayer?.displayName ?? 'The QM'} is reading their question...
        </Text>
        <Text style={styles.waitHint}>Get ready to guess!</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.xl,
    justifyContent: 'center',
  },
  label: {
    ...Typography.label,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  arrangeWrapper: {
    gap: Spacing.xl,
    width: '100%',
  },
  arrangeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  arrangeTitle: {
    ...Typography.display,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  cardList: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rankLabel: {
    ...Typography.label,
    color: Colors.primary,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  trackerArea: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  waitContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  waitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.sm,
  },
  waitTitle: {
    ...Typography.heading,
    color: Colors.white,
    textAlign: 'center',
  },
  waitHint: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
});
