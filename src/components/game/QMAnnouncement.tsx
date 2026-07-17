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
        <View style={styles.stamp}><Text style={styles.stampText}>QM</Text></View>
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
    color: Colors.inkSoft,
  },
  title: {
    ...Typography.display,
    color: Colors.ink,
  },
  nameCard: {
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['3xl'],
    borderBottomWidth: 5,
    borderBottomColor: Colors.primaryEdge,
    minWidth: 220,
  },
  stamp: {
    borderWidth: 2,
    borderColor: Colors.onPrimary,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 1,
    transform: [{ rotate: '-3deg' }],
  },
  stampText: {
    ...Typography.label,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  hint: {
    ...Typography.body,
    color: Colors.inkSoft,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
