import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuthContext } from '../_layout'
import { usePlayerStore } from '../../src/store/playerStore'
import { useGameStore } from '../../src/store/gameStore'
import { Button } from '../../src/components/ui/Button'
import { BackButton } from '../../src/components/ui/BackButton'
import { AdultConsentGate } from '../../src/components/game/AdultConsentGate'
import { ADULT_WARNING_VERSION } from '../../src/data/packs'
import { Colors, Spacing, Typography, Radius, Layout } from '../../src/theme'

export default function JoinScreen() {
  const router = useRouter()
  const { user, setDisplayName } = useAuthContext()
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setRoom = usePlayerStore((s) => s.setRoom)
  const setAdultConfirmed = usePlayerStore((s) => s.setAdultConfirmed)
  const setAnswerPhaseStartedAt = useGameStore((s) => s.setAnswerPhaseStartedAt)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showConsent, setShowConsent] = useState(false)

  const trimmed = name.trim()
  const canJoin = trimmed.length >= 2 && code.length === 6 && !!user && !loading

  const handleJoin = async (roomCode: string, adultConfirmed = false) => {
    if (!user || trimmed.length < 2) return
    setLoading(true)
    setErrorMsg('')
    setShowConsent(false)

    await setDisplayName(trimmed)
    setPlayer(user.id, trimmed)

    const { data, error } = await supabase.functions.invoke('join-room', {
      body: {
        room_code: roomCode,
        display_name: trimmed,
        adult_confirmed: adultConfirmed,
        adult_warning_version: ADULT_WARNING_VERSION,
      },
    })
    setLoading(false)

    if (error) {
      const body = error.context ? await error.context.json().catch(() => null) : null
      const errorCode = body?.error
      if (errorCode === 'ADULT_CONFIRMATION_REQUIRED') {
        // The room uses the mature pack — collect confirmation, then retry.
        setShowConsent(true)
        return
      } else if (errorCode === 'ROOM_NOT_FOUND') {
        setErrorMsg('Room not found. Check the code and try again.')
      } else if (errorCode === 'ROOM_NOT_IN_LOBBY') {
        setErrorMsg('This game has already started.')
      } else if (errorCode === 'ROOM_CLOSED') {
        setErrorMsg('This game has already ended.')
      } else {
        setErrorMsg('Something went wrong. Try again.')
      }
      return
    }

    setRoom(data.room_id, data.room_code, false, data.pack)
    setAdultConfirmed(!!data.adult_confirmed)

    if (data.is_late_join) {
      if (data.answer_phase_started_at) {
        setAnswerPhaseStartedAt(data.answer_phase_started_at)
      }

      const players = data.players ?? []
      const hasRound = data.current_round_id && data.question_id && data.visible_question_ids?.length > 0
      useGameStore.getState().initGame(
        players,
        user!.id,
        data.room_code,
        data.pack,
        hasRound ? {
          qmPlayerId: data.current_qm_id,
          questionId: data.question_id,
          visibleQuestionIds: data.visible_question_ids,
          roundId: data.current_round_id,
        } : undefined
      )

      const isQM = data.current_qm_id === user?.id

      switch (data.current_status) {
        case 'qm_active':
          router.replace(isQM ? '/(game)/qm-active' : '/(game)/waiting')
          break
        case 'answer_phase':
          if (isQM) {
            router.replace({ pathname: '/(game)/qm-active', params: { rejoin: '1' } })
          } else {
            router.replace('/(game)/answer-phase')
          }
          break
        case 'round_results':
        case 'leaderboard':
          router.replace('/(game)/leaderboard')
          break
        default:
          router.replace('/(game)/round-start')
      }
    } else {
      router.replace('/(game)/lobby')
    }
  }

  const handleChangeCode = (text: string) => {
    const upper = text.toUpperCase()
    setCode(upper)
    if (upper.length === 6 && trimmed.length >= 2) handleJoin(upper)
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <BackButton />
        <View style={styles.inner}>

          <View style={styles.header}>
            <Text style={styles.title}>Join a Room</Text>
            <Text style={styles.subtitle}>Enter your name and the room code</Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={[styles.codeInput, !!errorMsg && styles.inputError]}
              placeholder="Enter code..."
              placeholderTextColor={Colors.muted}
              value={code}
              onChangeText={handleChangeCode}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
              keyboardType="default"
              returnKeyType="next"
            />

            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={20}
              returnKeyType="go"
              onSubmitEditing={() => canJoin && handleJoin(code)}
            />
            <Text style={styles.fieldHelp}>Name or nickname.</Text>

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <Button
              title={loading ? 'Joining...' : 'Join'}
              onPress={() => handleJoin(code)}
              disabled={!canJoin}
            />
          </View>

        </View>

        <AdultConsentGate
          visible={showConsent}
          loading={loading}
          onConfirm={() => handleJoin(code, true)}
          onCancel={() => setShowConsent(false)}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: Layout.screenPaddingBottom,
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  header: { gap: Spacing.sm },
  title: { ...Typography.display, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.muted, textAlign: 'center' },
  inputSection: { gap: Spacing.md },
  nameInput: {
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
    marginTop: -Spacing.sm + 2,
    marginLeft: Spacing.xs,
  },
  codeInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 10,
    color: Colors.ink,
    textAlign: 'center',
  },
  inputError: { borderColor: Colors.error },
  error: { ...Typography.body, color: Colors.error, textAlign: 'center' },
})
