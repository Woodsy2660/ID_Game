import React, { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { usePlayerStore } from '../../src/stores/playerStore'
import { RoomCode } from '../../src/components/RoomCode'
import { Button } from '../../src/components/Button'

export default function CreateScreen() {
  const router = useRouter()
  const { display_name, setRoom } = usePlayerStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [roomCode, setRoomCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const createRoom = async () => {
    setStatus('loading')
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('create-room', {
      body: { display_name },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.label}>Creating your room...</Text>
      </View>
    )
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
        <Button label="Try Again" onPress={createRoom} />
      </View>
    )
  }

  return (
    <View style={styles.center}>
      <RoomCode code={roomCode} large />
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 20,
    padding: 32,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  error: {
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
})
