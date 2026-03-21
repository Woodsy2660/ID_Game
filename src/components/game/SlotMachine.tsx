import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import questionBank from '../../data/questionBank.json';

interface Props {
  /** The final question ID to reveal */
  questionId: number;
  /** Called when the reveal animation completes */
  onRevealed?: () => void;
}

/**
 * Slot machine animation: cycles through random question texts rapidly,
 * then decelerates and lands on the real question.
 */
export function SlotMachine({ questionId, onRevealed }: Props) {
  const [displayText, setDisplayText] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const containerOpacity = useSharedValue(0);
  const textScale = useSharedValue(1);

  const realQuestion = questionBank.find((q) => q.id === questionId);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 300 });

    // Cycle through random questions, slowing down
    const totalDuration = 2500; // total animation time
    const steps = 18;
    let step = 0;

    const tick = () => {
      if (step < steps) {
        // Pick a random question that isn't the real one
        const pool = questionBank.filter((q) => q.id !== questionId);
        const random = pool[Math.floor(Math.random() * pool.length)];
        setDisplayText(random.text);
        step++;

        // Exponential slowdown: starts fast (60ms), ends slow (350ms)
        const delay = 60 + Math.pow(step / steps, 2.5) * 300;
        setTimeout(tick, delay);
      } else {
        // Final reveal
        setDisplayText(realQuestion?.text ?? '');
        setIsRevealed(true);
        textScale.value = withSequence(
          withTiming(1.06, { duration: 150, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 200 })
        );
        onRevealed?.();
      }
    };

    // Start after a brief pause
    setTimeout(tick, 400);
  }, [questionId]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
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
    borderColor: Colors.amber,
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
    backgroundColor: Colors.amber,
    opacity: 0.3,
    borderRadius: 1,
  },
});
