import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import questionBank from '../../data/questionBank.json';

interface Props {
  /** The correct question ID to land on */
  questionId: number;
  /** The 10 visible answer option IDs (what answerers will choose from) */
  visibleQuestionIds: number[];
  /** Called when the reveal animation completes */
  onRevealed?: () => void;
}

/**
 * Roulette-style slot machine: spins through numbers 1–10 rapidly,
 * decelerates, and lands on the correct answer number with a gold highlight.
 * After landing, the question text fades in below the number.
 */
export function SlotMachine({ questionId, visibleQuestionIds, onRevealed }: Props) {
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const containerOpacity = useSharedValue(0);
  const numberScale = useSharedValue(1);
  const realQuestion = questionBank.find((q) => q.id === questionId);
  const correctIndex = visibleQuestionIds.indexOf(questionId);
  const totalOptions = visibleQuestionIds.length; // 10

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 300 });

    let step = 0;
    const steps = 24; // more steps for a longer spin

    const tick = () => {
      if (step < steps) {
        // Cycle 1–10 round-robin
        setDisplayNumber((step % totalOptions) + 1);
        step++;

        // Exponential slowdown: starts fast (40ms), ends slow (450ms)
        const delay = 40 + Math.pow(step / steps, 3) * 420;
        setTimeout(tick, delay);
      } else {
        // Land on the correct answer number
        setDisplayNumber(correctIndex + 1);
        setIsRevealed(true);

        numberScale.value = withSequence(
          withTiming(1.15, { duration: 150, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 200 })
        );

        onRevealed?.();
      }
    };

    setTimeout(tick, 400);
  }, [questionId]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.card, isRevealed && styles.cardRevealed]}>
        {/* Big spinning number */}
        <Animated.View style={numberStyle}>
          <Text style={[styles.number, isRevealed && styles.numberRevealed]}>
            {displayNumber ?? '?'}
          </Text>
        </Animated.View>

        {/* No question text here — SecretQuestionCard below handles that */}
      </View>

      {/* Scanline while spinning */}
      {!isRevealed && (
        <View style={styles.scanline} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardRevealed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.raised,
  },
  number: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.muted,
    textAlign: 'center',
  },
  numberRevealed: {
    color: Colors.primary,
  },
  scanline: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.25,
    borderRadius: 1,
  },
});
