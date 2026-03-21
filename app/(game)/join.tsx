import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { usePlayerStore } from '../../src/stores/playerStore'
import { Button } from '../../src/components/Button'

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
      const code = body?.error
      if (code === 'ROOM_NOT_FOUND') {
        setErrorMsg('Room not found. Check the code and try again.')
      } else if (code === 'ROOM_NOT_IN_LOBBY') {
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Join a Room</Text>

        <TextInput
          style={styles.input}
          placeholder="ENTER CODE"
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
          label="Join"
          onPress={() => handleJoin(code)}
          disabled={code.length !== 6}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#1F2937',
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
})
