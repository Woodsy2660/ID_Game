import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthContext } from '../_layout'
import { usePlayerStore } from '../../src/stores/playerStore'
import { Button } from '../../src/components/ui/Button'
import { Logo } from '../../src/components/ui/Logo'
import { Colors, Spacing, Typography, Radius } from '../../src/theme'
import { useOnboarding } from '../../src/hooks/useOnboarding'
import { OnboardingModal } from '../../src/components/onboarding/OnboardingModal'

export default function HomeScreen() {
  const [name, setName] = useState('')
  const router = useRouter()
  const { user, authError, setDisplayName } = useAuthContext()
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const onboarding = useOnboarding()

  const trimmed = name.trim()
  const isValid = trimmed.length >= 2 && !!user

  const handleCreateRoom = async () => {
    if (!user) return
    await setDisplayName(trimmed)
    setPlayer(user.id, trimmed)
    router.push('/(game)/create')
  }

  const handleJoinRoom = async () => {
    if (!user) return
    await setDisplayName(trimmed)
    setPlayer(user.id, trimmed)
    router.push('/(game)/join')
  }

  return (
    <>
      <OnboardingModal {...onboarding} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.inner}>

            <View style={styles.logoSection}>
              <Logo size="large" showText />
              <Text style={styles.tagline}>Who knows who best?</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Your name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={Colors.muted}
                value={name}
                onChangeText={setName}
                maxLength={20}
                autoFocus
                returnKeyType="done"
              />

              {authError ? (
                <Text style={styles.authError}>
                  Could not connect — check Anonymous sign-in is enabled.
                </Text>
              ) : null}

              <View style={styles.buttons}>
                <Button title="Create Room" onPress={handleCreateRoom} disabled={!isValid} />
                <Button
                  title="Join Room"
                  onPress={handleJoinRoom}
                  variant="secondary"
                  disabled={!isValid}
                />
                <TouchableOpacity onPress={onboarding.open} style={styles.howToPlay}>
                  <Text style={styles.howToPlayText}>How to play</Text>
                </TouchableOpacity>
              </View>
            </View>

            {__DEV__ && (
              <TouchableOpacity onPress={() => router.push('/dev')} style={styles.devLink}>
                <Text style={styles.devLinkText}>⚙ Dev Mode</Text>
              </TouchableOpacity>
            )}

          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['3xl'],
  },
  logoSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  tagline: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.md,
  },
  inputLabel: {
    ...Typography.label,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
  },
  buttons: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  howToPlay: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  howToPlayText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  authError: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
  devLink: {
    alignSelf: 'center',
    padding: Spacing.sm,
  },
  devLinkText: {
    ...Typography.label,
  },
})
