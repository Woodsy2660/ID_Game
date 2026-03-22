import React, { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { usePlayerStore } from '../../src/stores/playerStore'
import { ScreenContainer } from '../../src/components/ui/ScreenContainer'
import { Button } from '../../src/components/ui/Button'
import { Card } from '../../src/components/ui/Card'
import { Colors, Spacing, Typography, Radius } from '../../src/theme'

export default function CreateScreen() {
  const router = useRouter()
  const { display_name, setRoom } = usePlayerStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [roomCode, setRoomCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const createRoom = async () => {
    setStatus('loading')
    const { data, error } = await supabase.functions.invoke('create-room', {
      body: { display_name },
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

  useEffect(() => {
    createRoom()
  }, [])

  if (status === 'loading') {
    return (
      <ScreenContainer centered>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Creating your room...</Text>
      </ScreenContainer>
    )
  }

  if (status === 'error') {
    return (
      <ScreenContainer centered>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Button title="Try Again" onPress={createRoom} />
        </Card>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer centered>
      <Text style={styles.successLabel}>YOUR ROOM CODE</Text>
      <Card highlighted style={styles.codeCard}>
        <Text style={styles.roomCode}>{roomCode}</Text>
      </Card>
      <Text style={styles.successHint}>Taking you to the lobby...</Text>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  loadingText: {
    ...Typography.body,
    color: Colors.muted,
    marginTop: Spacing.lg,
  },
  errorCard: {
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
  },
  successLabel: {
    ...Typography.label,
    marginBottom: Spacing.md,
  },
  codeCard: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
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
    marginTop: Spacing.lg,
  },
})
