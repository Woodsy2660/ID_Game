import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { QMAnnouncement } from '../../src/components/game/QMAnnouncement';
import { useGameStore } from '../../src/store/gameStore';
import { Colors, Spacing, Typography } from '../../src/theme';

/**
 * Round Start screen — announces who the QM is for this round.
 * Auto-advances after a 3-second countdown.
 *
 * State machine: round_start → qm_active
 */
export default function RoundStartScreen() {
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const isQM = useGameStore((s) => s.isQM);
  const qmPlayer = useGameStore((s) => s.getQMPlayer());
  const advancePhase = useGameStore((s) => s.advancePhase);

  const [count, setCount] = useState(3);
  const navigatedRef = useRef(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animateNumber = () => {
    scale.value = withSequence(
      withTiming(1.4, { duration: 120, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withSequence(
      withTiming(0, { duration: 80 }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Animate the number change — must be in a separate effect so shared-value
  // writes happen outside the setState updater (avoids Reanimated strict-mode warning)
  useEffect(() => {
    if (count > 0) animateNumber();
  }, [count]);

  useEffect(() => {
    if (count <= 0 && !navigatedRef.current) {
      navigatedRef.current = true;
      advancePhase(); // → qm_active
      router.replace('/(game)/qm-active');
    }
  }, [count]);

  return (
    <ScreenContainer centered>
      <QMAnnouncement
        playerName={qmPlayer?.displayName ?? '???'}
        roundNumber={currentRound + 1}
        isLocalPlayer={isQM()}
      />
      <View style={styles.countdownArea}>
        <Text style={styles.countdownLabel}>STARTING IN</Text>
        <Animated.Text style={[styles.countdownNumber, animatedStyle]}>
          {count > 0 ? count : ''}
        </Animated.Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  countdownArea: {
    position: 'absolute',
    bottom: Spacing['4xl'],
    left: Spacing.xl,
    right: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  countdownLabel: {
    ...Typography.label,
    color: Colors.muted,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 56,
  },
});
