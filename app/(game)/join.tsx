import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
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
import { BackButton } from '../../src/components/ui/BackButton'
import { Colors, Spacing, Typography, Radius, Layout } from '../../src/theme'

export default function JoinScreen() {
  const router = useRouter()
  const { user, setDisplayName } = useAuthContext()
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setRoom = usePlayerStore((s) => s.setRoom)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const trimmed = name.trim()
  const canJoin = trimmed.length >= 2 && code.length === 6 && !!user && !loading

  const handleJoin = async (roomCode: string) => {
    if (!user || trimmed.length < 2) return
    setLoading(true)
    setErrorMsg('')

    await setDisplayName(trimmed)
    setPlayer(user.id, trimmed)

    const { data, error } = await supabase.functions.invoke('join-room', {
      body: { room_code: roomCode, display_name: trimmed },
    })
    setLoading(false)

    if (error) {
      const body = error.context ? await error.context.json().catch(() => null) : null
      const errorCode = body?.error
      if (errorCode === 'ROOM_NOT_FOUND') {
        setErrorMsg('Room not found. Check the code and try again.')
      } else if (errorCode === 'ROOM_NOT_IN_LOBBY') {
        setErrorMsg('This game has already started.')
      } else {
        setErrorMsg('Something went wrong. Try again.')
      }
      return
    }

    setRoom(data.room_id, data.room_code, false)
    router.replace('/(game)/lobby')
  }

  const handleChangeCode = (text: string) => {
    const upper = text.toUpperCase()
    setCode(upper)
    if (upper.length === 6 && trimmed.length >= 2) handleJoin(upper)
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <BackButton />
        <View style={styles.inner}>

          <View style={styles.header}>
            <Text style={styles.title}>Join a Room</Text>
            <Text style={styles.subtitle}>Enter your name and the room code</Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={[styles.codeInput, !!errorMsg && styles.inputError]}
              placeholder="Enter code..."
              placeholderTextColor={Colors.border}
              value={code}
              onChangeText={handleChangeCode}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
              keyboardType="default"
              returnKeyType="next"
            />

            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={20}
              returnKeyType="go"
              onSubmitEditing={() => canJoin && handleJoin(code)}
            />

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <Button
              title={loading ? 'Joining...' : 'Join'}
              onPress={() => handleJoin(code)}
              disabled={!canJoin}
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
  },
  inner: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: Layout.screenPaddingBottom,
    justifyContent: 'center',
    gap: Spacing['3xl'],
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
  nameInput: {
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
  codeInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
})
