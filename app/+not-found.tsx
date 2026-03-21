import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen not found</Text>
      <Link href="/(auth)" style={styles.link}>Go home</Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 18, color: '#1F2937' },
  link: { fontSize: 15, color: '#4F46E5' },
})
