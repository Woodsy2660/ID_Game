import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, Radius } from '../../../theme';

const CARD_WIDTH = 88;
const CARD_HEIGHT = 56;
const OFF = 260;

const CARD_DEFS = [
  { id: 'P1', startX: -OFF, startY: -OFF, finalX: -38, finalY: -30, rotate: '-7deg' },
  { id: 'P2', startX: OFF, startY: -OFF, finalX: 30, finalY: -46, rotate: '6deg' },
  { id: 'P3', startX: -OFF, startY: OFF, finalX: -52, finalY: 24, rotate: '-2deg' },
  { id: 'P4', startX: OFF, startY: OFF, finalX: 44, finalY: 40, rotate: '9deg' },
] as const;

interface CardItemProps {
  def: typeof CARD_DEFS[number];
  delay: number;
  floatOffset: number;
  isActive: boolean;
  reduceMotion: boolean;
}

function CardItem({ def, delay, floatOffset, isActive, reduceMotion }: CardItemProps) {
  const tx = useSharedValue(def.startX);
  const ty = useSharedValue(def.startY);
  const floatY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = def.rotate;

  useEffect(() => {
    if (isActive) {
      if (reduceMotion) {
        tx.value = def.finalX;
        ty.value = def.finalY;
        opacity.value = 1;
        return;
      }
      opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
      tx.value = withDelay(
        delay,
        withTiming(def.finalX, { duration: 700, easing: Easing.out(Easing.cubic) })
      );
      ty.value = withDelay(
        delay,
        withTiming(def.finalY, { duration: 700, easing: Easing.out(Easing.cubic) })
      );
      floatY.value = withDelay(
        delay + 1000,
        withRepeat(
          withSequence(
            withTiming(1.8, { duration: 2600 + floatOffset, easing: Easing.inOut(Easing.ease) }),
            withTiming(-1.8, { duration: 2600 + floatOffset, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    } else {
      tx.value = def.startX;
      ty.value = def.startY;
      opacity.value = 0;
      floatY.value = 0;
    }
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value + floatY.value },
      { rotate: rotation },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, animStyle]}>
      <Text style={styles.cardLabel}>{def.id}</Text>
    </Animated.View>
  );
}

interface Props {
  isActive: boolean;
  reduceMotion: boolean;
}

export function OnboardingVisualSetup({ isActive, reduceMotion }: Props) {
  return (
    <View style={styles.container}>
      {CARD_DEFS.map((def, i) => (
        <CardItem
          key={def.id}
          def={def}
          delay={i * 120}
          floatOffset={i * 300}
          isActive={isActive}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
