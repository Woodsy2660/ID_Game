import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { SecretQuestionCard } from '../../src/components/game/SecretQuestionCard';
import { SubmissionTracker } from '../../src/components/game/SubmissionTracker';
import { GuessOptionList } from '../../src/components/game/GuessOptionList';
import { useGameStore } from '../../src/store/gameStore';
import { getGameChannel } from '../../src/services/mockBroadcast';
import { startMockSubmissions, stopMockSubmissions } from '../../src/services/mockSubmissions';
import { Colors, Spacing, Typography } from '../../src/theme';
import questionBank from '../../src/data/questionBank.json';

/**
 * Answer Phase screen — splits into two views:
 *
 * QM view: sees their secret question + submission tracker
 * Answerer view: sees the 10 options and picks one
 *
 * State machine: answer_phase → round_results (when all answered)
 */
export default function AnswerPhaseScreen() {
  const router = useRouter();
  const isQM = useGameStore((s) => s.isQM);
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

  // Start mock submissions for AI players when QM
  useEffect(() => {
    if (isQM()) {
      startMockSubmissions();
    }
    return () => stopMockSubmissions();
  }, []);

  // Listen for all_answered event
  useEffect(() => {
    const channel = getGameChannel();
    const unsub = channel.on('round:all_answered', () => {
      setTimeout(() => {
        computeResults();
        advancePhase(); // → round_results
        router.replace('/(game)/round-results');
      }, 800);
    });
    return unsub;
  }, []);

  // Check if all answered after local submission
  useEffect(() => {
    if (hasSubmitted && allAnswered()) {
      setTimeout(() => {
        computeResults();
        advancePhase();
        router.replace('/(game)/round-results');
      }, 800);
    }
  }, [submissions, hasSubmitted]);

  const handleSelect = (qId: number) => {
    setSelectedId(qId);
  };

  const handleSubmit = () => {
    if (selectedId == null || !localPlayerId) return;
    submitAnswer(localPlayerId, selectedId);
    setHasSubmitted(true);

    if (allAnswered()) {
      const channel = getGameChannel();
      channel.emit('round:all_answered', {});
    }
  };

  // QM View
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
