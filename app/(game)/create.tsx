import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuthContext } from '../_layout'
import { usePlayerStore } from '../../src/stores/playerStore'
import { Button } from '../../src/components/ui/Button'
import { Card } from '../../src/components/ui/Card'
import { Colors, Spacing, Typography, Radius, Layout } from '../../src/theme'

export default function CreateScreen() {
  const router = useRouter()
  const { user, setDisplayName } = useAuthContext()
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setRoom = usePlayerStore((s) => s.setRoom)

  const [name, setName] = useState('')
  const [status, setStatus] = useState<'input' | 'loading' | 'success' | 'error'>('input')
  const [roomCode, setRoomCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const trimmed = name.trim()
  const isValid = trimmed.length >= 2 && !!user

  const createRoom = async () => {
    if (!user) return
    setStatus('loading')

    await setDisplayName(trimmed)
    setPlayer(user.id, trimmed)

    const { data, error } = await supabase.functions.invoke('create-room', {
      body: { display_name: trimmed },
    })
    if (error || !data) {
      setErrorMsg(error?.message ?? 'Something went wrong.')
      setStatus('error')
      return
    }
    setRoom(data.room_id, data.room_code, true)
    setRoomCode(data.room_code)
    setStatus('success')
    setTimeout(() => router.replace('/(game)/lobby'), 1500)
  }

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Creating your room...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Button title="Try Again" onPress={() => setStatus('input')} />
          </Card>
        </View>
      </SafeAreaView>
    )
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.successLabel}>YOUR ROOM CODE</Text>
          <Card highlighted style={styles.codeCard}>
            <Text style={styles.roomCode}>{roomCode}</Text>
          </Card>
          <Text style={styles.successHint}>Taking you to the lobby...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

          <View style={styles.header}>
            <Text style={styles.title}>Create a Room</Text>
            <Text style={styles.subtitle}>Enter your name to get started</Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={() => isValid && createRoom()}
            />

            <Button
              title="Create Room"
              onPress={createRoom}
              disabled={!isValid}
            />
          </View>

        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safe: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: Layout.screenPaddingBottom,
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
  },
  header: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.display,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  inputSection: {
    gap: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.muted,
    marginTop: Spacing.md,
  },
  errorCard: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
  successLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  codeCard: {
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  roomCode: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 8,
  },
  successHint: {
    ...Typography.body,
    color: Colors.muted,
    marginTop: Spacing.md,
  },
})
