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
 * Roulette-style slot machine: cycles through the 10 answer options rapidly,
 * decelerates, and lands on the correct answer with a gold highlight.
 *
 * This spins through the actual answer choices — the same 10 options
 * that the answerers will see — so the QM can watch it "select" their question.
 */
export function SlotMachine({ questionId, visibleQuestionIds, onRevealed }: Props) {
  const [displayText, setDisplayText] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const containerOpacity = useSharedValue(0);
  const textScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.15);

  const realQuestion = questionBank.find((q) => q.id === questionId);

  // Build the pool of answer options (excluding the correct one for spinning)
  const answerOptions = visibleQuestionIds
    .filter((id) => id !== questionId)
    .map((id) => questionBank.find((q) => q.id === id))
    .filter(Boolean) as { id: number; text: string }[];

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 300 });

    borderOpacity.value = withSequence(
      withTiming(0.4, { duration: 600 }),
      withTiming(0.15, { duration: 600 })
    );

    let step = 0;
    const steps = 20;

    const tick = () => {
      if (step < steps) {
        // Cycle through the answer options round-robin style
        const option = answerOptions[step % answerOptions.length];
        setDisplayText(option?.text ?? '...');
        step++;

        // Exponential slowdown: starts fast (50ms), ends slow (400ms)
        const delay = 50 + Math.pow(step / steps, 2.8) * 380;
        setTimeout(tick, delay);
      } else {
        // Final reveal — land on the correct answer
        setDisplayText(realQuestion?.text ?? '');
        setIsRevealed(true);
        textScale.value = withSequence(
          withTiming(1.06, { duration: 150, easing: Easing.out(Easing.cubic) }),
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

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.card, isRevealed && styles.cardRevealed]}>
        <Animated.View style={textStyle}>
          <Text style={[styles.questionText, isRevealed && styles.questionTextRevealed]}>
            {displayText || '...'}
          </Text>
        </Animated.View>
      </View>
      {!isRevealed && (
        <Animated.View style={[styles.scanline, scanlineStyle]} />
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
  questionText: {
    ...Typography.heading,
    color: Colors.muted,
    textAlign: 'center',
  },
  questionTextRevealed: {
    color: Colors.white,
  },
  scanline: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
});
