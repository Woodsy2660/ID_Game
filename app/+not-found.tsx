import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { Colors } from '../src/theme'

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen not found</Text>
      <Link href="/(auth)" style={styles.link}>Go home</Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: Colors.bg },
  title: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  link: { fontSize: 15, fontWeight: '600', color: Colors.navy },
})
