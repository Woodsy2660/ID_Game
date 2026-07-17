import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuthContext } from '../_layout'
import { usePlayerStore } from '../../src/store/playerStore'
import { Button } from '../../src/components/ui/Button'
import { Card } from '../../src/components/ui/Card'
import { BackButton } from '../../src/components/ui/BackButton'
import { PackSelector } from '../../src/components/game/PackSelector'
import { AdultConsentGate } from '../../src/components/game/AdultConsentGate'
import { ADULT_WARNING_VERSION, isMaturePack } from '../../src/data/packs'
import type { PackId } from '../../src/store/types'
import { Colors, Spacing, Typography, Radius, Layout } from '../../src/theme'

export default function CreateScreen() {
  const router = useRouter()
  const { user, setDisplayName } = useAuthContext()
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setRoom = usePlayerStore((s) => s.setRoom)
  const setAdultConfirmed = usePlayerStore((s) => s.setAdultConfirmed)

  const [name, setName] = useState('')
  const [pack, setPack] = useState<PackId>('boys') // Infamous is never the default
  const [status, setStatus] = useState<'input' | 'loading' | 'success' | 'error'>('input')
  const [roomCode, setRoomCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showConsent, setShowConsent] = useState(false)

  const trimmed = name.trim()
  const isValid = trimmed.length >= 2 && !!user

  // Entry point for the Create button. Mature pack → show the 18+ gate first.
  const handleCreate = () => {
    if (!isValid) return
    if (isMaturePack(pack)) {
      setShowConsent(true)
      return
    }
    createRoom(false)
  }

  const createRoom = async (adultConfirmed: boolean) => {
    if (!user) return
    setShowConsent(false)
    setStatus('loading')

    await setDisplayName(trimmed)
    setPlayer(user.id, trimmed)

    const { data, error } = await supabase.functions.invoke('create-room', {
      body: {
        display_name: trimmed,
        pack,
        adult_confirmed: adultConfirmed,
        adult_warning_version: ADULT_WARNING_VERSION,
      },
    })
    if (error || !data) {
      setErrorMsg(error?.message ?? 'Something went wrong.')
      setStatus('error')
      return
    }
    setRoom(data.room_id, data.room_code, true, pack)
    setAdultConfirmed(isMaturePack(pack))
    setRoomCode(data.room_code)
    setStatus('success')
    setTimeout(() => router.replace('/(game)/lobby'), 1500)
  }

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.navy} />
          <Text style={styles.loadingText}>Creating your room...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Button title="Try Again" onPress={() => setStatus('input')} />
          </Card>
        </View>
      </SafeAreaView>
    )
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.successLabel}>YOUR ROOM CODE</Text>
          <Card highlighted style={styles.codeCard}>
            <Text style={styles.roomCode}>{roomCode}</Text>
          </Card>
          <Text style={styles.successHint}>Taking you to the lobby...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <BackButton />
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create a Room</Text>
            <Text style={styles.subtitle}>Pick a pack and enter your name</Text>
          </View>

          <PackSelector selected={pack} onSelect={setPack} />

          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={20}
              returnKeyType="go"
              onSubmitEditing={handleCreate}
            />
            <Text style={styles.fieldHelp}>Name or nickname.</Text>

            <Button title="Create Room" onPress={handleCreate} disabled={!isValid} />
          </View>
        </ScrollView>

        <AdultConsentGate
          visible={showConsent}
          onConfirm={() => createRoom(true)}
          onCancel={() => setShowConsent(false)}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: Layout.screenPaddingBottom,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
  },
  header: { gap: Spacing.sm },
  title: { ...Typography.display, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.muted, textAlign: 'center' },
  inputSection: { gap: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
  },
  fieldHelp: {
    ...Typography.helper,
    marginTop: -2,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  loadingText: { ...Typography.body, color: Colors.muted, marginTop: Spacing.md },
  errorCard: { alignItems: 'center', gap: Spacing.md, width: '100%' },
  errorText: { ...Typography.body, color: Colors.error, textAlign: 'center' },
  successLabel: { ...Typography.label, marginBottom: Spacing.sm },
  codeCard: { alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  roomCode: { fontSize: 40, fontWeight: '800', color: Colors.ink, letterSpacing: 8 },
  successHint: { ...Typography.body, color: Colors.muted, marginTop: Spacing.md },
})
