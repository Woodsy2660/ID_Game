import React, { useState } from 'react'
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { usePlayerStore } from '../../store/playerStore'
import { useGameStore } from '../../store/gameStore'
import { Colors, Spacing, Radius, Typography } from '../../theme'

/**
 * QM-only "Forfeit Turn" control. There is deliberately no reroll.
 * Forfeiting skips the QM's turn (no points, timer + submissions cancelled) and
 * advances everyone to the leaderboard via the round:forfeited broadcast. The
 * caller doesn't receive its own broadcast, so it navigates locally on success.
 */
export function ForfeitTurnButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const forfeitRound = useGameStore((s) => s.forfeitRound)

  const doForfeit = async () => {
    const { room_id } = usePlayerStore.getState()
    setLoading(true)
    try {
      if (room_id) {
        await supabase.functions.invoke('forfeit-turn', { body: { room_id } })
      }
    } catch {
      // Non-fatal — navigate anyway so the QM is never stuck on their turn.
    }
    setConfirming(false)
    setLoading(false)
    forfeitRound() // deterministic reset → leaderboard (no points, timer cleared)
    router.replace('/(game)/leaderboard')
  }

  return (
    <>
      <Pressable
        onPress={() => setConfirming(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Text style={styles.triggerText}>Forfeit turn</Text>
      </Pressable>

      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Forfeit your turn?</Text>
            <Text style={styles.body}>
              This skips your turn with no points for anyone, cancels the timer and
              answers, and moves to the next Question Master. You can't reroll.
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => setConfirming(false)}
                disabled={loading}
                style={({ pressed }) => [styles.keep, pressed && styles.dim]}
              >
                <Text style={styles.keepText}>KEEP PLAYING</Text>
              </Pressable>
              <Pressable
                onPress={doForfeit}
                disabled={loading}
                style={({ pressed }) => [styles.forfeit, pressed && !loading && styles.dim, loading && styles.disabled]}
              >
                <Text style={styles.forfeitText}>{loading ? 'SKIPPING…' : 'FORFEIT'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triggerText: { ...Typography.helper, color: Colors.muted, fontWeight: '600' },
  pressed: { opacity: 0.7 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { ...Typography.heading, color: Colors.white },
  body: { ...Typography.body, color: Colors.muted },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  keep: {
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepText: { fontSize: 13, fontWeight: '800', color: Colors.black, letterSpacing: 0.8, textTransform: 'uppercase' },
  forfeit: {
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forfeitText: { fontSize: 13, fontWeight: '700', color: Colors.error, letterSpacing: 0.8, textTransform: 'uppercase' },
  dim: { opacity: 0.85, transform: [{ translateY: 1 }] },
  disabled: { opacity: 0.4 },
})
