import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';

interface Props {
  playerName: string;
  roundNumber: number;
  isLocalPlayer: boolean;
}

export function QMAnnouncement({ playerName, roundNumber, isLocalPlayer }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withTiming(1.05, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 200 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.roundLabel}>ROUND {roundNumber}</Text>
      <Text style={styles.title}>Question Master</Text>
      <View style={styles.nameCard}>
        <Text style={styles.name}>{playerName}</Text>
      </View>
      {isLocalPlayer && (
        <Text style={styles.hint}>You are the Question Master this round</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  roundLabel: {
    ...Typography.label,
    color: Colors.muted,
  },
  title: {
    ...Typography.display,
    color: Colors.primary,
  },
  nameCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
  },
  name: {
    ...Typography.heading,
    color: Colors.white,
    textAlign: 'center',
  },
  hint: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
