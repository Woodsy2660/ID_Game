import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { useAuthContext } from '../_layout'
import { Button } from '../../src/components/ui/Button'
import { Logo } from '../../src/components/ui/Logo'
import { Colors, Typography } from '../../src/theme'
import { useOnboarding } from '../../src/hooks/useOnboarding'
import { OnboardingModal } from '../../src/components/onboarding/OnboardingModal'

const ANIM_DURATION = 300
const SLIDE_OFFSET = 18
const EASE = Easing.out(Easing.cubic)

function useStaggeredEntry(delay: number, skipAnimation: boolean) {
  const opacity = useSharedValue(skipAnimation ? 1 : 0)
  const translateY = useSharedValue(skipAnimation ? 0 : SLIDE_OFFSET)

  useEffect(() => {
    if (!skipAnimation) {
      opacity.value = withDelay(delay, withTiming(1, { duration: ANIM_DURATION, easing: EASE }))
      translateY.value = withDelay(delay, withTiming(0, { duration: ANIM_DURATION, easing: EASE }))
    }
  }, [skipAnimation])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return style
}

function useScaleEntry(delay: number, skipAnimation: boolean) {
  const opacity = useSharedValue(skipAnimation ? 1 : 0)
  const scale = useSharedValue(skipAnimation ? 1 : 0.8)

  useEffect(() => {
    if (!skipAnimation) {
      opacity.value = withDelay(delay, withTiming(1, { duration: ANIM_DURATION, easing: EASE }))
      scale.value = withDelay(delay, withTiming(1, { duration: ANIM_DURATION, easing: EASE }))
    }
  }, [skipAnimation])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return style
}

export default function HomeScreen() {
  const router = useRouter()
  const { authError } = useAuthContext()
  const onboarding = useOnboarding()
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => { if (enabled) setReduceMotion(true) })
      .catch(() => {})
  }, [])

  const logoStyle = useScaleEntry(100, reduceMotion)
  const titleStyle = useStaggeredEntry(200, reduceMotion)
  const taglineStyle = useStaggeredEntry(300, reduceMotion)
  const howToPlayStyle = useStaggeredEntry(400, reduceMotion)
  const createBtnStyle = useStaggeredEntry(500, reduceMotion)
  const joinBtnStyle = useStaggeredEntry(600, reduceMotion)
  const footerStyle = useStaggeredEntry(700, reduceMotion)

  return (
    <>
      <OnboardingModal {...onboarding} />
      <SafeAreaView style={styles.safe}>
        {/* ── How to play — top right ── */}
        <Animated.View style={[styles.howToPlayWrap, howToPlayStyle]}>
          <TouchableOpacity onPress={onboarding.open} style={styles.howToPlay}>
            <View style={styles.howToPlayIcon}>
              <Text style={styles.howToPlayIconText}>?</Text>
            </View>
            <Text style={styles.howToPlayText}>How to play</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.inner}>

          {/* ── Content block — centered ~45% from top ── */}
          <View style={styles.content}>

            {/* Logo */}
            <Animated.View style={[styles.logoWrap, logoStyle]}>
              <Logo size="large" showText={false} />
            </Animated.View>

            {/* Title */}
            <Animated.View style={[styles.titleRow, titleStyle]}>
              <Text style={styles.titleWhite}>THE ID </Text>
              <Text style={styles.titleGold}>GAME</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={taglineStyle}>
              <Text style={styles.tagline}>No friendships will be harmed… probably.</Text>
            </Animated.View>

            {/* CTAs */}
            {authError ? (
              <Text style={styles.authError}>
                Could not connect — check Anonymous sign-in is enabled.
              </Text>
            ) : null}

            <Animated.View style={[{ alignSelf: 'stretch' }, createBtnStyle]}>
              <Button title="Create Room" onPress={() => router.push('/(game)/create')} />
            </Animated.View>

            <View style={{ height: 24 }} />

            <Animated.View style={[{ alignSelf: 'stretch' }, joinBtnStyle]}>
              <Button
                title="Join Room"
                onPress={() => router.push('/(game)/join')}
                variant="secondary"
              />
            </Animated.View>
          </View>

          {/* ── Footer ── */}
          <Animated.View style={[styles.footer, footerStyle]}>
            <Text style={styles.footerText}>made with love by the Stanmore Youngins</Text>
          </Animated.View>

        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  /* ── Content block — sits ~45% from top via bottom padding bias ── */
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '2%',
  },
  logoWrap: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWhite: {
    fontSize: 36.4,
    fontWeight: '900',
    color: Colors.white,
  },
  titleGold: {
    fontSize: 36.4,
    fontWeight: '900',
    color: Colors.primary,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 70,
  },

  /* ── How to play ── */
  howToPlayWrap: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },
  howToPlay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  howToPlayIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  howToPlayIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 14,
  },
  howToPlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.3,
  },

  /* ── Auth error ── */
  authError: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },

  /* ── Footer ── */
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '300',
    color: Colors.muted,
    opacity: 0.4,
    textAlign: 'center',
  },
})
