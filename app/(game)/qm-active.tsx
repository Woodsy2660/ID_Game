import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { SlotMachine } from '../../src/components/game/SlotMachine';
import { useGameStore } from '../../src/store/gameStore';
import { Colors, Spacing, Typography } from '../../src/theme';

/**
 * QM Active screen — the secret question is revealed via SlotMachine animation.
 * After the reveal, the QM taps "Let them guess!" to move to answer_phase.
 *
 * For answerers, this shows a waiting state.
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

  const handleBeginGuessing = () => {
    advancePhase(); // → answer_phase
    router.replace('/(game)/answer-phase');
  };

  if (isQM()) {
    // QM sees the slot machine reveal
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <Text style={styles.label}>YOUR SECRET QUESTION</Text>
          <Text style={styles.subtitle}>Show this to everyone — but keep a poker face!</Text>

          <SlotMachine
            questionId={questionId!}
            onRevealed={() => setRevealed(true)}
          />

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

  // Answerer sees a waiting screen
  return (
    <ScreenContainer centered>
      <View style={styles.waitContainer}>
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
    color: Colors.amber,
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
