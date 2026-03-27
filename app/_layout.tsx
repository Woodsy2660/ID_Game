import React, { createContext, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { User } from '@supabase/supabase-js'
import { useAuth } from '../src/hooks/useAuth'
import { usePlayerStore } from '../src/stores/playerStore'
import { supabase } from '../src/lib/supabase'
import { RejoinPrompt } from '../src/components/RejoinPrompt'
import { Colors } from '../src/theme'

interface AuthContextValue {
  user: User | null
  authError: string | null
  setDisplayName: (name: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  authError: null,
  setDisplayName: async () => {},
})

export function useAuthContext() {
  return useContext(AuthContext)
}

export default function RootLayout() {
  const { session, user, loading, authError, setDisplayName } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [showRejoinPrompt, setShowRejoinPrompt] = useState(false)
  // Only run rejoin check once per page load — prevents re-triggering on auth token refresh
  const rejoinChecked = React.useRef(false)

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) {
      router.replace('/(auth)')
    }
  }, [session, loading, segments])

  // Check for persisted session after auth is restored — runs once per page load only
  useEffect(() => {
    if (loading || !session) return
    if (rejoinChecked.current) return
    rejoinChecked.current = true

    const checkRejoin = async () => {
      const { room_id } = usePlayerStore.getState()
      if (!room_id) return

      const { data: room } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', room_id)
        .single()

      if (!room || room.status === 'closed' || room.status === 'lobby') {
        usePlayerStore.getState().clearRoom()
        return
      }

      // Room is active — show rejoin prompt
      setShowRejoinPrompt(true)
    }

    checkRejoin()
  }, [session, loading])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthContext.Provider value={{ user, authError, setDisplayName }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors?.black || '#121212' },
            animation: 'fade'
          }}
        />
        {showRejoinPrompt && (
          <RejoinPrompt onDismiss={() => setShowRejoinPrompt(false)} />
        )}
      </AuthContext.Provider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
})
