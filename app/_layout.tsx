import React, { createContext, useContext, useEffect } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { User } from '@supabase/supabase-js'
import { useAuth } from '../src/hooks/useAuth'
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

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    const inDev = segments[0] === 'dev'
    const inGame = segments[0] === '(game)'
    // Allow dev and game routes to bypass auth (for local testing)
    if (!session && !inAuth && !inDev && !inGame) {
      router.replace('/(auth)')
    }
  }, [session, loading, segments])

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
