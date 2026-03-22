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
import { usePlayerStore } from '../../src/stores/playerStore'
import { Button } from '../../src/components/ui/Button'
import { Colors, Spacing, Typography, Radius } from '../../src/theme'

export default function JoinScreen() {
  const router = useRouter()
  const { display_name, setRoom } = usePlayerStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleJoin = async (roomCode: string) => {
    setLoading(true)
    setErrorMsg('')
    const { data, error } = await supabase.functions.invoke('join-room', {
      body: { room_code: roomCode, display_name },
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
    if (upper.length === 6) handleJoin(upper)
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

          <View style={styles.header}>
            <Text style={styles.title}>Join a Room</Text>
            <Text style={styles.subtitle}>Enter the 6-character room code</Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={[styles.input, !!errorMsg && styles.inputError]}
              placeholder="······"
              placeholderTextColor={Colors.border}
              value={code}
              onChangeText={handleChangeCode}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
              keyboardType="default"
              returnKeyType="go"
              onSubmitEditing={() => code.length === 6 && handleJoin(code)}
            />

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <Button
              title="Join"
              onPress={() => handleJoin(code)}
              disabled={code.length !== 6 || loading}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['3xl'],
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
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 18,
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
