import React, { createContext, useContext, useEffect } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { User } from '@supabase/supabase-js'
import { useAuth } from '../src/hooks/useAuth'

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
    if (!session && !inAuth) {
      router.replace('/(auth)')
    }
  }, [session, loading, segments])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ user, authError, setDisplayName }}>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthContext.Provider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
