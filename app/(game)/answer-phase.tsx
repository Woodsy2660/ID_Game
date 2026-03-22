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
 * Answer submissions are written to round_answers and broadcast to all
 * clients via the game channel so everyone sees the live count.
 *
 * State machine: answer_phase → round_results (when all answered)
 */
export default function AnswerPhaseScreen() {
  const router = useRouter();
  const isQM = useGameStore((s) => s.isQM);
  const roomCode = useGameStore((s) => s.roomCode);
  const roundId = useGameStore((s) => s.roundId);
  const questionId = useGameStore((s) => s.questionId);
  const visibleQuestionIds = useGameStore((s) => s.visibleQuestionIds);
  const players = useGameStore((s) => s.players);
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const submissions = useGameStore((s) => s.submissions);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const allAnswered = useGameStore((s) => s.allAnswered);
  const computeResults = useGameStore((s) => s.computeResults);
  const advancePhase = useGameStore((s) => s.advancePhase);

  const qmPlayer = players.find((p) => p.id === qmPlayerId);
  const answerers = players.filter((p) => p.id !== qmPlayerId);
  const submittedCount = Object.keys(submissions).length;
  const question = questionBank.find((q) => q.id === questionId);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Guard against duplicate transitions if multiple submissions arrive close together
  const transitionedRef = useRef(false);

  const transition = () => {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    setTimeout(() => {
      computeResults();
      advancePhase(); // → round_results
      router.replace('/(game)/round-results');
    }, 800);
  };

  // When a remote player submits, record it in the store so the tracker updates
  // and so computeResults() has everyone's guess available.
  const { broadcastAnswer } = useGameChannel(roomCode ?? '', {
    onAnswerSubmitted: ({ playerId, guessedQuestionId }) => {
      submitAnswer(playerId, guessedQuestionId);
    },
  });

  // In dev mode (no real Supabase), simulate other players answering
  useEffect(() => {
    if (isQM() && roomCode?.startsWith('DEV')) {
      startMockSubmissions();
      return () => stopMockSubmissions();
    }
  }, []);

  // Transition when all non-QM players have answered (fires for both QM and answerers)
  useEffect(() => {
    if (answerers.length > 0 && allAnswered()) {
      transition();
    }
  }, [submissions]);

  const handleSelect = (qId: number) => {
    setSelectedId(qId);
  };

  const handleSubmit = async () => {
    if (selectedId == null || !localPlayerId || !roundId) return;

    // Update local store immediately so UI responds
    submitAnswer(localPlayerId, selectedId);
    setHasSubmitted(true);

    // Persist to database
    await supabase.from('round_answers').insert({
      round_id: roundId,
      player_id: localPlayerId,
      guessed_question_id: selectedId,
      is_correct: selectedId === questionId,
    });

    // Notify all other clients
    await broadcastAnswer({ playerId: localPlayerId, guessedQuestionId: selectedId });
  };

  // QM View — sees the question and watches submissions come in
  if (isQM()) {
    return (
      <ScreenContainer>
        <View style={styles.qmContainer}>
          <SecretQuestionCard
            questionText={question?.text ?? ''}
            qmName={qmPlayer?.displayName ?? ''}
          />
          <View style={styles.trackerSection}>
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

  // Answerer View
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
          disabled={hasSubmitted}
        />

        {!hasSubmitted ? (
          <View style={styles.submitArea}>
            <Button
              title="Lock In Answer"
              onPress={handleSubmit}
              disabled={selectedId == null}
            />
          </View>
        ) : (
          <View style={styles.submittedArea}>
            <View style={styles.submittedDot} />
            <Text style={styles.submittedText}>Answer locked in! Waiting for others...</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  qmContainer: {
    flex: 1,
    gap: Spacing['3xl'],
  },
  trackerSection: {
    marginTop: 'auto',
  },
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
  submittedArea: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submittedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.tertiary,
  },
  submittedText: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
});
