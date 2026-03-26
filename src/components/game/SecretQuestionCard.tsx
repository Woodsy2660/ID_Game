import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';

interface Props {
  questionText: string;
  qmName: string;
}

/**
 * Displays the secret question to the QM.
 * "Who is most likely to... {question}?"
 */
export function SecretQuestionCard({ questionText, qmName }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.card}>
        <Text style={styles.label}>YOUR SECRET QUESTION</Text>
        <Text style={styles.question}>{questionText}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  question: {
    ...Typography.display,
    color: Colors.white,
  },
});
