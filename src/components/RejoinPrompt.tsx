import React, { useState } from 'react'
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { usePlayerStore } from '../stores/playerStore'
import { useGameStore } from '../store/gameStore'
import { Button } from './ui/Button'
import { Colors, Spacing, Typography, Radius } from '../theme'

interface RejoinPromptProps {
  onDismiss: () => void
}

export function RejoinPrompt({ onDismiss }: RejoinPromptProps) {
  const router = useRouter()
  const { room_id, room_code, player_id, display_name, clearRoom, clearPersistedSession } = usePlayerStore()
  const setAnswerPhaseStartedAt = useGameStore((s) => s.setAnswerPhaseStartedAt)
  const [loading, setLoading] = useState(false)

  const handleRejoin = async () => {
    if (!room_code || !player_id || !display_name) {
      clearPersistedSession()
      onDismiss()
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('join-room', {
        body: { room_code, display_name },
      })

      if (error) {
        const body = error.context ? await error.context.json().catch(() => null) : null
        const code = body?.error
        if (code === 'ROOM_NOT_FOUND' || code === 'ROOM_CLOSED') {
          clearPersistedSession()
        }
        onDismiss()
        return
      }

      if (!data || !data.is_late_join) {
        // Room is in lobby — just go to lobby
        onDismiss()
        router.replace('/(game)/lobby')
        return
      }

      // Initialize game store with the full in-progress state
      if (data.answer_phase_started_at) {
        setAnswerPhaseStartedAt(data.answer_phase_started_at)
      }

      const players = data.players ?? []
      const hasRound =
        data.current_round_id &&
        data.question_id &&
        (data.visible_question_ids?.length ?? 0) > 0

      useGameStore.getState().initGame(
        players,
        player_id,
        data.room_code,
        hasRound
          ? {
              qmPlayerId: data.current_qm_id,
              questionId: data.question_id,
              visibleQuestionIds: data.visible_question_ids,
              roundId: data.current_round_id,
            }
          : undefined
      )

      const isQM = data.current_qm_id === player_id

      onDismiss()

      switch (data.current_status) {
        case 'lobby':
          router.replace('/(game)/lobby')
          break
        case 'round_start':
          router.replace('/(game)/round-start')
          break
        case 'qm_active':
          // Both QM and answerers land on qm-active — qm-active shows the correct view for each
          router.replace('/(game)/qm-active')
          break
        case 'answer_phase':
          if (isQM) {
            // QM sees tracker without slot machine animation
            router.replace({ pathname: '/(game)/qm-active', params: { rejoin: '1' } })
          } else {
            router.replace('/(game)/answer-phase')
          }
          break
        case 'round_results':
          router.replace('/(game)/round-results')
          break
        case 'leaderboard':
          router.replace('/(game)/leaderboard')
          break
        default:
          clearPersistedSession()
      }
    } catch (e) {
      console.warn('[RejoinPrompt] error:', e)
      clearPersistedSession()
      onDismiss()
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (room_id) {
      await supabase.functions.invoke('leave-room', { body: { room_id } })
    }
    clearPersistedSession()
    onDismiss()
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Rejoin Game?</Text>
          <Text style={styles.body}>You were in a game that may still be active.</Text>
          {room_code && (
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>ROOM</Text>
              <Text style={styles.code}>{room_code}</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.buttons}>
              <Button title="Rejoin" onPress={handleRejoin} />
              <Button title="Leave Game" onPress={handleLeave} variant="outlined" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing['3xl'],
    width: '100%',
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    ...Typography.heading,
    color: Colors.white,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  codeLabel: {
    ...Typography.label,
    color: Colors.muted,
  },
  code: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 4,
  },
  buttons: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
})
