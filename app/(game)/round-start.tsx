import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { QMAnnouncement } from '../../src/components/game/QMAnnouncement';
import { useGameStore } from '../../src/store/gameStore';
import { Spacing } from '../../src/theme';

/**
 * Round Start screen — announces who the QM is for this round.
 * Auto-advances after a brief display, or user taps "Continue".
 *
 * State machine: round_start → qm_active
 */
export default function RoundStartScreen() {
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const isQM = useGameStore((s) => s.isQM);
  const qmPlayer = useGameStore((s) => s.getQMPlayer());
  const advancePhase = useGameStore((s) => s.advancePhase);

  const handleContinue = () => {
    advancePhase(); // → qm_active
    router.replace('/(game)/qm-active');
  };

  // Auto-advance after 3 seconds
  useEffect(() => {
    const timer = setTimeout(handleContinue, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenContainer centered>
      <QMAnnouncement
        playerName={qmPlayer?.displayName ?? '???'}
        roundNumber={currentRound + 1}
        isLocalPlayer={isQM()}
      />
      <View style={styles.buttonArea}>
        <Button title="Continue" onPress={handleContinue} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonArea: {
    position: 'absolute',
    bottom: Spacing['4xl'],
    left: Spacing.xl,
    right: Spacing.xl,
  },
});
