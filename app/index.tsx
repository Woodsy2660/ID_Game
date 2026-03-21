import { Redirect } from 'expo-router'

// The root route immediately hands off to the auth flow.
// app/(auth)/index.tsx is the real entry point (name entry + create/join room).
export default function Index() {
  return <Redirect href="/(auth)" />
}
