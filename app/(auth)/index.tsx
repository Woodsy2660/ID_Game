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
import { Colors, Spacing, Typography, Layout } from '../../src/theme'
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

          <View style={styles.logoSection}>
            <Logo size="large" showText />
            <Text style={styles.tagline}>Who knows who best?</Text>
          </View>

          <View style={styles.actions}>
            {authError ? (
              <Text style={styles.authError}>
                Could not connect — check Anonymous sign-in is enabled.
              </Text>
            ) : null}

            <View style={styles.buttons}>
              <Button title="Create Room" onPress={() => router.push('/(game)/create')} />
              <Button
                title="Join Room"
                onPress={() => router.push('/(game)/join')}
                variant="secondary"
              />
            </View>
            <TouchableOpacity onPress={onboarding.open} style={styles.howToPlay}>
              <Text style={styles.howToPlayText}>How to play</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
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
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: Layout.screenPaddingBottom,
  },
  logoSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
  buttons: {
    gap: 16,
  },
  howToPlay: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: 12,
  },
  howToPlayText: {
    ...Typography.helper,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  authError: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerText: {
    ...Typography.helper,
    fontSize: 12,
    color: Colors.muted,
    opacity: 0.5,
    textAlign: 'center',
  },
  devLink: {
    padding: Spacing.sm,
  },
  devLinkText: {
    ...Typography.label,
  },
})
