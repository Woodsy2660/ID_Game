import 'react-native-gesture-handler'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Colors } from '../../src/theme'
import { useExitCleanup } from '../../src/hooks/useExitCleanup'

export default function GameLayout() {
  // Calls leave-room (or end-game for host) via sendBeacon when the tab closes
  useExitCleanup()

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          contentStyle: { backgroundColor: Colors?.black || '#121212' },
          animation: 'fade',
        }}
      />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
