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
import { useAuthContext } from '../_layout'
import { usePlayerStore } from '../../src/stores/playerStore'
import { Button } from '../../src/components/Button'

export default function HomeScreen() {
  const [name, setName] = useState('')
  const router = useRouter()
  const { user, authError, setDisplayName } = useAuthContext()
  const setPlayer = usePlayerStore((s) => s.setPlayer)

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>ID Game</Text>
        <Text style={styles.subtitle}>Who knows who best?</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          maxLength={20}
          autoFocus
          returnKeyType="done"
        />

        {authError ? (
          <Text style={styles.authError}>
            Could not connect to server: {authError}{'\n'}
            Check that Anonymous sign-in is enabled in your Supabase project.
          </Text>
        ) : null}

        <View style={styles.buttons}>
          <Button label="Create Room" onPress={handleCreateRoom} disabled={!isValid} />
          <View style={styles.gap} />
          <Button label="Join Room" onPress={handleJoinRoom} disabled={!isValid} />
        </View>
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
    fontSize: 40,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  buttons: {
    marginTop: 8,
  },
  gap: {
    height: 12,
  },
  authError: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 18,
  },
})
