import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Shadow } from '../../theme';

/**
 * A small ID card that slowly rotates around its Y-axis — a subtle, on-brand
 * loader shown to answerers while the Question Master reads their question.
 * Falls back to a static card when reduce-motion is on.
 */
export function SpinningIDCard() {
  const rot = useSharedValue(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    const spin = () => {
      rot.value = withRepeat(withTiming(360, { duration: 2200, easing: Easing.linear }), -1, false);
    };
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (!mounted) return;
        if (enabled) setReduced(true);
        else spin();
      })
      .catch(() => {
        if (mounted) spin();
      });
    return () => {
      mounted = false;
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateY: `${rot.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.card, Shadow.card, !reduced && animStyle]}>
      <View style={styles.photo} />
      <View style={styles.lines}>
        <View style={[styles.line, { width: '65%' }]} />
        <View style={[styles.line, { width: '100%' }]} />
        <View style={[styles.line, { width: '82%' }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 104,
    height: 66,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: Colors.navyEdge,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
  },
  photo: {
    width: 26,
    height: 34,
    borderRadius: 6,
    backgroundColor: 'rgba(19,35,96,0.85)',
  },
  lines: {
    flex: 1,
    gap: 5,
  },
  line: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(19,35,96,0.5)',
  },
});
