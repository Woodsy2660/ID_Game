import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { SecretQuestionCard } from '../../src/components/game/SecretQuestionCard';
import { SubmissionTracker } from '../../src/components/game/SubmissionTracker';
import { GuessOptionList } from '../../src/components/game/GuessOptionList';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { supabase } from '../../src/lib/supabase';
import { Colors, Spacing, Typography } from '../../src/theme';
import questionBank from '../../src/data/questionBank.json';
import { startMockSubmissions, stopMockSubmissions } from '../../src/services/mockSubmissions';

/**
 * Answer Phase screen — splits into two views:
 *
 * QM view: sees their secret question + live submission tracker
 * Answerer view: sees 10 options and picks one
 *
 * When all non-QM players have answered:
 *   - computeResults() is called to populate roundResults in the store
 *   - results:ready is broadcast so all devices navigate at the same time
 *   - All clients router.replace to round-results
 *
 * State machine: answer_phase → round_results (when all answered)
 */
export default function AnswerPhaseScreen() {
  const router = useRouter();
  const roomCode = useGameStore((s) => s.roomCode);
  const roundId = useGameStore((s) => s.roundId);
  const questionId = useGameStore((s) => s.questionId);
  const visibleQuestionIds = useGameStore((s) => s.visibleQuestionIds);
  const players = useGameStore((s) => s.players);
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const submissions = useGameStore((s) => s.submissions);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const syncSubmissions = useGameStore((s) => s.syncSubmissions);
  const computeResults = useGameStore((s) => s.computeResults);
  const advancePhase = useGameStore((s) => s.advancePhase);

  const qmPlayer = players.find((p) => p.id === qmPlayerId);
  const answerers = players.filter((p) => p.id !== qmPlayerId);
  const submittedCount = Object.keys(submissions).length;
  const question = questionBank.find((q) => q.id === questionId);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Guard against duplicate transitions across all paths (local, broadcast, onResultsReady)
  const transitionedRef = useRef(false);
  // Holds the broadcast function after useGameChannel sets it up — used by navigateToResults
  const broadcastResultsReadyRef = useRef<((submissions: Record<string, number>) => Promise<void>) | null>(null);

  /**
   * Single entry point for transitioning to round-results.
   * Called from three places:
   *   1. handleSubmit — when this player was the last to answer
   *   2. onAnswerSubmitted — when a remote answer completed the set
   *   3. onResultsReady — when another device already detected completion and broadcast it
   */
  const navigateToResults = () => {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    // Broadcast the complete submissions map so all devices compute from identical data
    const authoritative = useGameStore.getState().submissions;
    broadcastResultsReadyRef.current?.(authoritative);
    // Compute results synchronously before mounting round-results so the store is ready
    computeResults();
    advancePhase(); // answer_phase → round_results
    router.replace('/(game)/round-results');
  };

  const { broadcastAnswer, broadcastResultsReady } = useGameChannel(roomCode ?? '', {
    onAnswerSubmitted: ({ playerId, guessedQuestionId }) => {
      submitAnswer(playerId, guessedQuestionId);
      // Check right after recording — if this was the last remote answer, transition
      if (useGameStore.getState().allAnswered()) {
        navigateToResults();
      }
    },
    // Another device detected all-answered first and broadcast the authoritative submissions.
    // Sync them here so this device computes results from identical data, then navigate.
    onResultsReady: ({ submissions: authoritative }) => {
      syncSubmissions(authoritative);
      navigateToResults();
    },
  });
  // Assign after useGameChannel so navigateToResults can call it via ref
  broadcastResultsReadyRef.current = broadcastResultsReady;

  // In dev mode (no real Supabase), simulate other players answering
  useEffect(() => {
    const isDevMode = roomCode?.startsWith('DEV');
    if (isDevMode) {
      startMockSubmissions();
      return () => stopMockSubmissions();
    }
  }, []);

  const handleSelect = (qId: number) => setSelectedId(qId);

  const handleSubmit = async () => {
    if (selectedId == null || !localPlayerId) return;

    // Record locally FIRST so allAnswered() reflects this submission immediately
    submitAnswer(localPlayerId, selectedId);
    setHasSubmitted(true);

    // Check right now — if this player was the last to answer, navigate immediately
    // without waiting for any network calls
    if (useGameStore.getState().allAnswered()) {
      navigateToResults();
    }

    // DB persist and broadcast are best-effort side effects — non-blocking for navigation
    try {
      if (roundId) {
        await supabase.from('round_answers').insert({
          round_id: roundId,
          player_id: localPlayerId,
          guessed_question_id: selectedId,
          is_correct: selectedId === questionId,
        });
      }
      await broadcastAnswer({ playerId: localPlayerId, guessedQuestionId: selectedId });
    } catch {
      // Non-fatal — local state is correct, other devices rely on results:ready broadcast
    }
  };

  // Fallback: watch the submissions state directly. Handles the case where
  // onAnswerSubmitted broadcasts are delayed or missed on this device.
  useEffect(() => {
    if (answerers.length > 0 && submittedCount >= answerers.length) {
      navigateToResults();
    }
  }, [submittedCount]);

  // ─── Answerer waiting view — shown after submitting until everyone is done ─
  if (hasSubmitted) {
    return (
      <ScreenContainer>
        <View style={styles.waitingContainer}>
          <View style={styles.waitingTop}>
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>ANSWER LOCKED IN</Text>
            </View>
            <Text style={styles.waitingTitle}>Waiting for others...</Text>
          </View>
          <View style={styles.waitingTracker}>
            <SubmissionTracker
              submitted={submittedCount}
              total={answerers.length}
              playerNames={answerers.map((p) => p.displayName)}
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Answerer picking view ─────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <View style={styles.answererContainer}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>
            WHICH QUESTION DID {qmPlayer?.displayName?.toUpperCase()} GET?
          </Text>
        </View>

        <GuessOptionList
          visibleQuestionIds={visibleQuestionIds}
          onSelect={handleSelect}
          selectedId={selectedId}
          disabled={false}
        />

        <View style={styles.submitArea}>
          <Button
            title="Lock In Answer"
            onPress={handleSubmit}
            disabled={selectedId == null}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  answererContainer: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.lg,
  },
  headerLabel: {
    ...Typography.label,
    color: Colors.primary,
    textAlign: 'center',
  },
  submitArea: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing['2xl'],
  },
  waitingTop: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  lockedBadge: {
    backgroundColor: Colors.tertiary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
  },
  lockedBadgeText: {
    ...Typography.label,
    color: Colors.black,
  },
  waitingTitle: {
    ...Typography.display,
    textAlign: 'center',
  },
  waitingTracker: {
    gap: Spacing.md,
  },
});
