import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// Placeholder — partner build connects here
export default function RoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Game starting...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#6B7280' },
})
