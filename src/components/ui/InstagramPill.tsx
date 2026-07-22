import React, { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet, Linking } from 'react-native';
import { AccessibilityInfo } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Shadow } from '../../theme';

const INSTAGRAM_URL = 'https://www.instagram.com/idgameapp/';
// Slight stamp-style tilt, matching Badge / the 18+ and QM stamps elsewhere in the app.
const ROTATION = '-3deg';

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={5.5} stroke={Colors.navy} strokeWidth={2} />
      <Circle cx={12} cy={12} r={4.2} stroke={Colors.navy} strokeWidth={2} />
      <Circle cx={17.2} cy={6.8} r={1.1} fill={Colors.navy} />
    </Svg>
  );
}

/**
 * Top-corner pill promoting the Instagram account — styled to match (and sit
 * opposite) the "How to play" pill, with a gold stamp outline and a slight
 * tilt. The whole pill pulses gently on a loop to draw the eye; falls back to
 * a static (but still tilted) pill under reduce-motion.
 */
export function InstagramPill() {
  const scale = useSharedValue(1);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (!mounted) return;
        if (enabled) {
          setReduced(true);
          return;
        }
        scale.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 900, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) })
          ),
          -1,
          false
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: ROTATION }, { scale: reduced ? 1 : scale.value }],
  }));

  const handlePress = () => {
    Linking.openURL(INSTAGRAM_URL).catch(() => {});
  };

  return (
    <Animated.View style={pulseStyle}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
        accessibilityRole="link"
        accessibilityLabel="Open The ID Game's Instagram, at idgameapp"
      >
        <InstagramIcon size={16} />
        <Text style={styles.label}>@idgameapp</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Shadow.soft,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
    letterSpacing: 0.2,
  },
});
