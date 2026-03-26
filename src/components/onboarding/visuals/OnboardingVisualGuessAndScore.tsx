import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Colors, Radius } from '../../../theme';

const CARD_W = 200;
const CARD_H = 50;

interface Props {
  isActive: boolean;
  reduceMotion: boolean;
}

/**
 * Merged visual for "Guess the question" + "Score a point":
 * - Both cards visible from the start
 * - Middle card gets selected highlight
 * - Then tick/cross icons animate in (from scoring screen)
 */
export function OnboardingVisualGuessAndScore({ isActive, reduceMotion }: Props) {
  // Card appearance
  const cardAOpacity = useSharedValue(0);
  const cardBOpacity = useSharedValue(0);
  // Selection highlight on card A
  const selectedProgress = useSharedValue(0);
  const cardBDimOpacity = useSharedValue(1);
  // Tick/cross icons
  const greenOpacity = useSharedValue(0);
  const greenScale = useSharedValue(0.4);
  const redOpacity = useSharedValue(0);
  const redScale = useSharedValue(0.4);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (isActive) {
      if (reduceMotion) {
        cardAOpacity.value = 1;
        cardBOpacity.value = 1;
        selectedProgress.value = 1;
        cardBDimOpacity.value = 0.35;
        greenOpacity.value = 1;
        greenScale.value = 1;
        redOpacity.value = 1;
        redScale.value = 1;
        return;
      }

      // Phase 1: Both cards fade in
      cardAOpacity.value = withTiming(1, { duration: 400 });
      cardBOpacity.value = withDelay(130, withTiming(1, { duration: 400 }));

      // Phase 2: Select card A (highlight), dim card B
      selectedProgress.value = withDelay(
        900,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
      );
      cardBDimOpacity.value = withDelay(920, withTiming(0.35, { duration: 450 }));

      // Phase 3: Tick appears on card A
      timersRef.current.push(setTimeout(() => {
        greenOpacity.value = withTiming(1, { duration: 400 });
        greenScale.value = withSpring(1, { damping: 9, stiffness: 140 });
      }, 1800));

      // Phase 4: Cross appears on card B
      timersRef.current.push(setTimeout(() => {
        redOpacity.value = withTiming(1, { duration: 400 });
        redScale.value = withSpring(1, { damping: 9, stiffness: 140 });
      }, 2400));
    } else {
      cardAOpacity.value = 0;
      cardBOpacity.value = 0;
      selectedProgress.value = 0;
      cardBDimOpacity.value = 1;
      greenOpacity.value = 0;
      greenScale.value = 0.4;
      redOpacity.value = 0;
      redScale.value = 0.4;
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [isActive]);

  const cardAStyle = useAnimatedStyle(() => ({
    opacity: cardAOpacity.value,
    transform: [{ scale: 1 + 0.03 * selectedProgress.value }],
    borderColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [Colors.border, Colors.primary]
    ),
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [Colors.surface, Colors.raised]
    ),
  }));

  const cardBStyle = useAnimatedStyle(() => ({
    opacity: cardBOpacity.value * cardBDimOpacity.value,
  }));

  const greenStyle = useAnimatedStyle(() => ({
    opacity: greenOpacity.value,
    transform: [{ scale: greenScale.value }],
  }));

  const redStyle = useAnimatedStyle(() => ({
    opacity: redOpacity.value,
    transform: [{ scale: redScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Correct answer */}
      <View style={styles.row}>
        <Animated.View style={[styles.card, cardAStyle]}>
          <View style={styles.lines}>
            <View style={[styles.line, { width: '80%' }]} />
            <View style={[styles.line, { width: '55%' }]} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.iconCircle, styles.iconGreen, greenStyle]}>
          <Text style={styles.iconGreenText}>✓</Text>
        </Animated.View>
      </View>

      <View style={styles.spacer} />

      {/* Incorrect answer */}
      <View style={styles.row}>
        <Animated.View style={[styles.card, cardBStyle]}>
          <View style={styles.lines}>
            <View style={[styles.line, { width: '65%' }]} />
            <View style={[styles.line, { width: '45%' }]} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.iconCircle, styles.iconRed, redStyle]}>
          <Text style={styles.iconRedText}>✕</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spacer: {
    height: 14,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  lines: {
    gap: 8,
  },
  line: {
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconGreen: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: Colors.tertiary,
  },
  iconRed: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: Colors.error,
  },
  iconGreenText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.tertiary,
    lineHeight: 22,
  },
  iconRedText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
    lineHeight: 22,
  },
});
