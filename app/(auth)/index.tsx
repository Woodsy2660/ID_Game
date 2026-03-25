import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthContext } from '../_layout'
import { Button } from '../../src/components/ui/Button'
import { Logo } from '../../src/components/ui/Logo'
import { Colors, Typography } from '../../src/theme'
import { useOnboarding } from '../../src/hooks/useOnboarding'
import { OnboardingModal } from '../../src/components/onboarding/OnboardingModal'

export default function HomeScreen() {
  const router = useRouter()
  const { authError } = useAuthContext()
  const onboarding = useOnboarding()

  return (
    <>
      <OnboardingModal {...onboarding} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

          {/* ── Brand (fills available space, centers content) ── */}
          <View style={styles.brand}>
            <Logo size="large" showText={false} />
            <View style={styles.titleRow}>
              <Text style={styles.titleWhite}>THE ID </Text>
              <Text style={styles.titleGold}>GAME</Text>
            </View>
            <Text style={styles.tagline}>Who knows who best?</Text>
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            {authError ? (
              <Text style={styles.authError}>
                Could not connect — check Anonymous sign-in is enabled.
              </Text>
            ) : null}

            <Button title="Create Room" onPress={() => router.push('/(game)/create')} />
            <View style={{ height: 16 }} />
            <Button
              title="Join Room"
              onPress={() => router.push('/(game)/join')}
              variant="secondary"
            />
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onboarding.open} style={styles.howToPlay}>
              <Text style={styles.howToPlayText}>How to play</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>made with love by the Stanmore Youngins</Text>
            {__DEV__ && (
              <TouchableOpacity onPress={() => router.push('/dev')} style={styles.devLink}>
                <Text style={styles.devLinkText}>Dev Mode</Text>
              </TouchableOpacity>
            )}
          </View>

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
  },

  /* ── Brand (takes remaining space, centers vertically) ── */
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
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
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },

  /* ── Actions ── */
  actions: {
    paddingTop: 40,
  },
  authError: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },

  /* ── Footer ── */
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  howToPlay: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  howToPlayText: {
    ...Typography.helper,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footerText: {
    ...Typography.helper,
    fontSize: 12,
    color: Colors.muted,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 8,
  },
  devLink: {
    padding: 8,
    marginTop: 12,
  },
  devLinkText: {
    ...Typography.label,
  },
})
