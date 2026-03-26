import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Colors, Radius } from '../../../theme';

const CARD_W = 220;
const CARD_H = 48;
const GAP = 10;

const CARDS = [
  { id: 0, lineWidths: [0.7, 0.5] },
  { id: 1, lineWidths: [0.85, 0.6], isSelected: true },
  { id: 2, lineWidths: [0.6, 0.45] },
];

interface Props {
  isActive: boolean;
  reduceMotion: boolean;
}

export function OnboardingVisualGuessing({ isActive, reduceMotion }: Props) {
  const c0Opacity = useSharedValue(0);
  const c1Opacity = useSharedValue(0);
  const c2Opacity = useSharedValue(0);
  const selectedProgress = useSharedValue(0); // 0 = unselected, 1 = selected
  const c0FinalOpacity = useSharedValue(1);
  const c2FinalOpacity = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      if (reduceMotion) {
        c0Opacity.value = 1;
        c1Opacity.value = 1;
        c2Opacity.value = 1;
        selectedProgress.value = 1;
        c0FinalOpacity.value = 0.35;
        c2FinalOpacity.value = 0.35;
        return;
      }

      c0Opacity.value = withTiming(1, { duration: 400 });
      c1Opacity.value = withDelay(130, withTiming(1, { duration: 400 }));
      c2Opacity.value = withDelay(260, withTiming(1, { duration: 400 }));

      // After cards appear, highlight middle
      selectedProgress.value = withDelay(
        1000,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
      );
      c0FinalOpacity.value = withDelay(1020, withTiming(0.35, { duration: 450 }));
      c2FinalOpacity.value = withDelay(1020, withTiming(0.35, { duration: 450 }));
    } else {
      c0Opacity.value = 0;
      c1Opacity.value = 0;
      c2Opacity.value = 0;
      selectedProgress.value = 0;
      c0FinalOpacity.value = 1;
      c2FinalOpacity.value = 1;
    }
  }, [isActive]);

  const c0Style = useAnimatedStyle(() => ({
    opacity: c0Opacity.value * c0FinalOpacity.value,
  }));

  const c1Style = useAnimatedStyle(() => ({
    opacity: c1Opacity.value,
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

  const c2Style = useAnimatedStyle(() => ({
    opacity: c2Opacity.value * c2FinalOpacity.value,
  }));

  const allStyles = [c0Style, c1Style, c2Style];

  return (
    <View style={styles.container}>
      {CARDS.map((card, i) => (
        <Animated.View key={card.id} style={[styles.card, allStyles[i]]}>
          <View style={styles.lines}>
            {card.lineWidths.map((w, li) => (
              <View key={li} style={[styles.line, { width: `${w * 100}%` as any }]} />
            ))}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: GAP,
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
    gap: 7,
  },
  line: {
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
});
