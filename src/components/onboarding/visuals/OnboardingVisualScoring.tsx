import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors, Radius } from '../../../theme';

const CARD_W = 200;
const CARD_H = 50;

interface Props {
  isActive: boolean;
  reduceMotion: boolean;
}

export function OnboardingVisualScoring({ isActive, reduceMotion }: Props) {
  const cardAOpacity = useSharedValue(0);
  const greenOpacity = useSharedValue(0);
  const greenScale = useSharedValue(0.4);
  const cardBOpacity = useSharedValue(0);
  const redOpacity = useSharedValue(0);
  const redScale = useSharedValue(0.4);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (isActive) {
      if (reduceMotion) {
        cardAOpacity.value = 1;
        greenOpacity.value = 1;
        greenScale.value = 1;
        cardBOpacity.value = 1;
        redOpacity.value = 1;
        redScale.value = 1;
        return;
      }

      cardAOpacity.value = withTiming(1, { duration: 500 });

      timersRef.current.push(setTimeout(() => {
        greenOpacity.value = withTiming(1, { duration: 400 });
        greenScale.value = withSpring(1, { damping: 9, stiffness: 140 });
      }, 900));

      timersRef.current.push(setTimeout(() => {
        greenOpacity.value = withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) });
        greenScale.value = withTiming(0.6, { duration: 350 });
      }, 2600));

      timersRef.current.push(setTimeout(() => {
        cardBOpacity.value = withTiming(1, { duration: 400 });
      }, 3100));

      timersRef.current.push(setTimeout(() => {
        redOpacity.value = withTiming(1, { duration: 400 });
        redScale.value = withSpring(1, { damping: 9, stiffness: 140 });
      }, 3450));
    } else {
      cardAOpacity.value = 0;
      greenOpacity.value = 0;
      greenScale.value = 0.4;
      cardBOpacity.value = 0;
      redOpacity.value = 0;
      redScale.value = 0.4;
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [isActive]);

  const cardAStyle = useAnimatedStyle(() => ({ opacity: cardAOpacity.value }));
  const greenStyle = useAnimatedStyle(() => ({
    opacity: greenOpacity.value,
    transform: [{ scale: greenScale.value }],
  }));
  const cardBStyle = useAnimatedStyle(() => ({ opacity: cardBOpacity.value }));
  const redStyle = useAnimatedStyle(() => ({
    opacity: redOpacity.value,
    transform: [{ scale: redScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Correct answer */}
      <View style={styles.row}>
        <Animated.View style={[styles.card, styles.cardSelected, cardAStyle]}>
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
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.raised,
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
