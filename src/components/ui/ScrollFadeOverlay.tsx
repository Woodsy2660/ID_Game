import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const FADE_HEIGHT = 48;
const DURATION = 200;
const EASE = Easing.out(Easing.cubic);

// Background colour must match screen bg for the gradient to blend seamlessly
const BG = '#121212';

interface Props {
  showTop: boolean;
  showBottom: boolean;
  /** Height of each gradient band. Default 48. */
  height?: number;
  /** Background colour for the opaque end of the gradient. Default #121212. */
  bg?: string;
}

/**
 * Renders animated top + bottom gradient fades over a scroll area.
 *
 * Place this as a sibling of a ScrollView inside a `position: 'relative'` wrapper.
 * Both gradients use `pointerEvents="none"` so they never block touches.
 */
export function ScrollFadeOverlay({
  showTop,
  showBottom,
  height = FADE_HEIGHT,
  bg = BG,
}: Props) {
  const topOpacity = useSharedValue(0);
  const bottomOpacity = useSharedValue(0);

  useEffect(() => {
    topOpacity.value = withTiming(showTop ? 1 : 0, { duration: DURATION, easing: EASE });
  }, [showTop]);

  useEffect(() => {
    bottomOpacity.value = withTiming(showBottom ? 1 : 0, { duration: DURATION, easing: EASE });
  }, [showBottom]);

  const topStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
  }));

  return (
    <>
      <Animated.View
        style={[styles.top, { height }, topStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[bg, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[styles.bottom, { height }, bottomStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', bg]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
