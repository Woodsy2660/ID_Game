import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { SlotMachine } from '../../src/components/game/SlotMachine';
import { IDCard } from '../../src/components/game/IDCard';
import { SubmissionTracker } from '../../src/components/game/SubmissionTracker';
import { CountdownTimer } from '../../src/components/game/CountdownTimer';
import { LeaveGameButton } from '../../src/components/game/LeaveGameButton';
import { ForfeitTurnButton } from '../../src/components/game/ForfeitTurnButton';
import { SpinningIDCard } from '../../src/components/game/SpinningIDCard';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { usePlayerStore } from '../../src/store/playerStore';
import type { ResultsReadyPayload } from '../../src/hooks/useGameChannel';
import { supabase } from '../../src/lib/supabase';
import { removeAllChannels } from '../../src/lib/channelCleanup';
import { Colors, Spacing, Typography } from '../../src/theme';
import { ScrollFadeOverlay } from '../../src/components/ui/ScrollFadeOverlay';
import { useScrollFades } from '../../src/hooks/useScrollFades';
import { findQuestion } from '../../src/data/packs';

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
  const { rejoin } = useLocalSearchParams<{ rejoin?: string }>();
  const isRejoinAnswerPhase = rejoin === '1';
  const isQM = useGameStore((s) => s.isQM);
  const roomCode = useGameStore((s) => s.roomCode);
  const roundId = useGameStore((s) => s.roundId);
  const questionId = useGameStore((s) => s.questionId);
  const qmPlayer = useGameStore((s) => s.getQMPlayer());
  const advancePhase = useGameStore((s) => s.advancePhase);
  const setAnswerPhaseStartedAt = useGameStore((s) => s.setAnswerPhaseStartedAt);
  const answerPhaseStartedAt = useGameStore((s) => s.answerPhaseStartedAt);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const syncSubmissions = useGameStore((s) => s.syncSubmissions);
  const computeResults = useGameStore((s) => s.computeResults);
  const players = useGameStore((s) => s.players);
  const submissions = useGameStore((s) => s.submissions);
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);
  const pack = useGameStore((s) => s.pack);
  const { room_id } = usePlayerStore();

  // When rejoining during answer_phase, skip the slot machine animation entirely
  const [revealed, setRevealed] = useState(isRejoinAnswerPhase);
  const [showTracker, setShowTracker] = useState(isRejoinAnswerPhase);

  const question = findQuestion(pack, questionId ?? -1);
  const answerers = players.filter((p) => p.id !== qmPlayerId);
  const submittedCount = Object.keys(submissions).length;

  const {
    showTopFade: qmTopFade,
    showBottomFade: qmBottomFade,
    scrollHandler: qmScrollHandler,
    onContentSizeChange: qmContentSizeChange,
    onLayout: qmLayout,
  } = useScrollFades();

  // Timer ref so we can clean up the auto-broadcast on unmount
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
    onGameEnded: () => {
      removeAllChannels();
      usePlayerStore.getState().clearRoom();
      router.replace('/');
    },
    // Answerers navigate to answer-phase when they receive this; capture timer start
    onQMReady: isQM() ? undefined : ({ answerPhaseStartedAt: startedAt }) => {
      if (startedAt) setAnswerPhaseStartedAt(startedAt);
      navigateToAnswerPhase();
    },

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
    // A player left mid-round — QM rechecks if remaining answerers have all submitted
    onPlayerLeft: isQM() ? () => {
      if (useGameStore.getState().allAnswered()) {
        navigateToResults();
      }
    } : undefined,
    // Timer expired server-side — navigate everyone to results
    onRoundExpired: () => navigateToResults(),
    // QM left mid-round (answerer's device receives this) — skip to leaderboard
    onRoundForfeited: () => {
      if (transitionedRef.current) return;
      transitionedRef.current = true;
      useGameStore.getState().forfeitRound();
      router.replace('/(game)/leaderboard');
    },
  });

  const handleRevealed = () => {
    // Swap from the centered slot machine to the working layout (question pinned
    // at the top, ranking + tracker below). The question card fades into its
    // final position — one container, one width, so there's no reflow jank.
    setRevealed(true);

    if (isQM()) {
      const isDevMode = roomCode?.startsWith('DEV');
      // QM has already had 2.5s to read (built into SlotMachine).
      // Short delay for slide-up transition to finish, then broadcast and show tracker.
      revealTimerRef.current = setTimeout(async () => {
        if (isDevMode) {
          setShowTracker(true);
        } else {
          const { data } = await supabase.functions.invoke('qm-ready', {
            body: { room_code: roomCode },
          });
          if (data?.answerPhaseStartedAt) {
            setAnswerPhaseStartedAt(data.answerPhaseStartedAt);
          }
          setShowTracker(true);
        }
      }, 1500);
    }
  };

  // ─── QM view ──────────────────────────────────────────────────────────────
  if (isQM()) {
    const leaveOverlay = (
      <LeaveGameButton note="You're the Question Master — leaving forfeits this turn and passes host if you're the host." />
    );

    // Pre-reveal: centered slot machine.
    if (!revealed) {
      return (
        <ScreenContainer overlay={leaveOverlay}>
          <View style={styles.container}>
            <SlotMachine
              questionId={questionId!}
              pack={pack}
              onRevealed={handleRevealed}
            />
          </View>
        </ScreenContainer>
      );
    }

    // Post-reveal: one stable layout. Question card pinned at the top (fading
    // into place), ranking guide + tracker below. No width/position reflow.
    return (
      <ScreenContainer overlay={leaveOverlay}>
        <View style={styles.scrollWrapper}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={qmScrollHandler}
            scrollEventThrottle={16}
            onContentSizeChange={qmContentSizeChange}
            onLayout={qmLayout}
          >
            <Animated.View entering={FadeInDown.duration(420)} style={styles.questionTop}>
              <View style={styles.questionCard}>
                <Text style={styles.questionLabel}>YOUR SECRET QUESTION</Text>
                <Text style={styles.questionText}>{question?.text ?? ''}</Text>
              </View>
            </Animated.View>

            {showTracker && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.arrangeContainer}>
                <Text style={styles.arrangeTitle}>ARRANGE IDs</Text>
                <View style={styles.cardList}>
                  <Text style={styles.rankLabel}>MOST LIKELY</Text>
                  <IDCard delay={0} />
                  <IDCard delay={100} />
                  <IDCard delay={200} />
                  <Text style={styles.rankLabel}>LEAST LIKELY</Text>
                </View>
              </Animated.View>
            )}

            {showTracker && (
              <View style={styles.trackerArea}>
                {answerPhaseStartedAt && (
                  <CountdownTimer
                    answerPhaseStartedAt={answerPhaseStartedAt}
                    onExpire={() => {
                      if (roundId && room_id) {
                        supabase.functions.invoke('expire-round', {
                          body: { room_id, round_id: roundId },
                        });
                      }
                    }}
                  />
                )}
                <SubmissionTracker
                  submitted={submittedCount}
                  total={answerers.length}
                  players={answerers}
                  submittedPlayerIds={new Set(Object.keys(submissions))}
                />
                <ForfeitTurnButton />
              </View>
            )}
          </ScrollView>
          <ScrollFadeOverlay showTop={qmTopFade} showBottom={qmBottomFade} />
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
    <ScreenContainer centered overlay={<LeaveGameButton />}>
      <View style={styles.waitContainer}>
        <SpinningIDCard />
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
  scrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
    gap: Spacing.xl,
  },
  questionTop: {
    marginBottom: Spacing.sm,
  },
  questionCard: {
    backgroundColor: Colors.navy,
    borderRadius: 18,
    padding: Spacing['2xl'],
    gap: Spacing.sm,
    borderBottomWidth: 5,
    borderBottomColor: Colors.navyEdge,
  },
  questionLabel: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  questionText: {
    ...Typography.display,
    color: Colors.onNavy,
  },
  arrangeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  arrangeTitle: {
    ...Typography.display,
    color: Colors.ink,
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
    color: Colors.inkSoft,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  trackerArea: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  waitContainer: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  waitTitle: {
    ...Typography.heading,
    color: Colors.ink,
    textAlign: 'center',
  },
  waitHint: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
});
