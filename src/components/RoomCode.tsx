import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface RoomCodeProps {
  code: string
  large?: boolean
}

export function RoomCode({ code, large }: RoomCodeProps) {
  const spaced = code.split('').join(' ')
  return (
    <View style={styles.container}>
      <Text style={[styles.code, large && styles.large]}>{spaced}</Text>
      {large && <Text style={styles.hint}>Share with your group</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#1F2937',
  },
  large: {
    fontSize: 48,
    letterSpacing: 8,
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
})
