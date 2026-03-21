import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { SlotMachine } from '../../src/components/game/SlotMachine';
import { SecretQuestionCard } from '../../src/components/game/SecretQuestionCard';
import { useGameStore } from '../../src/store/gameStore';
import { Colors, Spacing, Typography } from '../../src/theme';
import questionBank from '../../src/data/questionBank.json';

/**
 * QM Active screen:
 * 1. Roulette wheel spins and lands on the secret question
 * 2. After reveal, the full SecretQuestionCard slides in below
 * 3. QM taps "Let them guess!" to advance to answer_phase
 *
 * Answerers see a waiting state.
 *
 * State machine: qm_active → answer_phase
 */
export default function QMActiveScreen() {
  const router = useRouter();
  const isQM = useGameStore((s) => s.isQM);
  const questionId = useGameStore((s) => s.questionId);
  const qmPlayer = useGameStore((s) => s.getQMPlayer());
  const advancePhase = useGameStore((s) => s.advancePhase);
  const [revealed, setRevealed] = useState(false);

  const question = questionBank.find((q) => q.id === questionId);

  const handleBeginGuessing = () => {
    advancePhase(); // → answer_phase
    router.replace('/(game)/answer-phase');
  };

  if (isQM()) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <Text style={styles.label}>YOUR SECRET QUESTION</Text>
          <Text style={styles.subtitle}>Show this to everyone — but keep a poker face!</Text>

          {/* Roulette wheel */}
          <SlotMachine
            questionId={questionId!}
            onRevealed={() => setRevealed(true)}
          />

          {/* After roulette lands, show the full question card */}
          {revealed && (
            <Animated.View entering={SlideInDown.duration(400).delay(300)}>
              <SecretQuestionCard
                questionText={question?.text ?? ''}
                qmName={qmPlayer?.displayName ?? ''}
              />
            </Animated.View>
          )}

          {/* CTA — only enabled after reveal */}
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

  // Answerer waiting screen
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
