import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  SlideInDown,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { SlotMachine } from '../../src/components/game/SlotMachine';
import { SecretQuestionCard } from '../../src/components/game/SecretQuestionCard';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { Colors, Spacing, Typography } from '../../src/theme';
import questionBank from '../../src/data/questionBank.json';

/**
 * QM Active screen:
 * 1. Roulette wheel spins and lands on the secret question
 * 2. After reveal, the full SecretQuestionCard slides in below
 * 3. QM taps "Let Them Guess!" → broadcasts qm:ready → all clients navigate to answer-phase
 *
 * Answerers see a waiting state and navigate when they receive qm:ready.
 *
 * State machine: qm_active → answer_phase
 */
export default function QMActiveScreen() {
  const router = useRouter();
  const isQM = useGameStore((s) => s.isQM);
  const roomCode = useGameStore((s) => s.roomCode);
  const questionId = useGameStore((s) => s.questionId);
  const visibleQuestionIds = useGameStore((s) => s.visibleQuestionIds);
  const qmPlayer = useGameStore((s) => s.getQMPlayer());
  const advancePhase = useGameStore((s) => s.advancePhase);
  const [revealed, setRevealed] = useState(false);

  const question = questionBank.find((q) => q.id === questionId);

  const navigateToAnswerPhase = () => {
    advancePhase(); // → answer_phase
    router.replace('/(game)/answer-phase');
  };

  const { broadcastQMReady } = useGameChannel(roomCode ?? '', {
    // Answerers receive this and navigate; QM sent it so they navigate directly in handleBeginGuessing.
    onQMReady: navigateToAnswerPhase,
  });

  const handleBeginGuessing = async () => {
    await broadcastQMReady();
    navigateToAnswerPhase();
  };

  if (isQM()) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <Text style={styles.label}>YOUR SECRET QUESTION</Text>
          <Text style={styles.subtitle}>Keep this secret! Rearrange the ID cards from most to least likely.</Text>

          <SlotMachine
            questionId={questionId!}
            visibleQuestionIds={visibleQuestionIds}
            onRevealed={() => setRevealed(true)}
          />

          {revealed && (
            <Animated.View entering={SlideInDown.duration(400).delay(300)}>
              <SecretQuestionCard
                questionText={question?.text ?? ''}
                qmName={qmPlayer?.displayName ?? ''}
              />
            </Animated.View>
          )}

          <View style={styles.buttonArea}>
            <Button
              title="Let Them Guess!"
              onPress={handleBeginGuessing}
              disabled={!revealed}
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Answerer waiting screen — navigation happens via onQMReady broadcast
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
  },
  label: {
    ...Typography.label,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
  },
  subtitle: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  buttonArea: {
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
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
