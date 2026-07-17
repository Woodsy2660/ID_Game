import React, { useState } from 'react'
import { View, Text, Pressable, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import { Colors, Spacing, Radius, Typography } from '../../theme'
import { useLeaveRoom } from '../../hooks/useLeaveRoom'

interface Props {
  /** Optional note shown in the confirm dialog (e.g. host-transfer / forfeit warning). */
  note?: string
}

/**
 * Top-left "Leave" control available on every in-game screen. Confirms before
 * leaving, then routes through leave-room (host transfer / QM forfeit / count
 * update handled server-side).
 */
export function LeaveGameButton({ note }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const leaveRoom = useLeaveRoom()

  const doLeave = async () => {
    setLeaving(true)
    await leaveRoom()
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setConfirming(true)}
        style={styles.button}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Leave game"
      >
        <Text style={styles.icon}>‹</Text>
        <Text style={styles.label}>Leave</Text>
      </TouchableOpacity>

      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Leave game?</Text>
            <Text style={styles.body}>
              {note ?? "You'll be removed from this room and your spot cleared."}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => setConfirming(false)}
                disabled={leaving}
                style={({ pressed }) => [styles.stay, pressed && styles.pressed]}
              >
                <Text style={styles.stayText}>STAY</Text>
              </Pressable>
              <Pressable
                onPress={doLeave}
                disabled={leaving}
                style={({ pressed }) => [styles.leave, pressed && !leaving && styles.pressed, leaving && styles.disabled]}
              >
                <Text style={styles.leaveText}>{leaving ? 'LEAVING…' : 'LEAVE'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    height: 40,
    paddingRight: 12,
    paddingLeft: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  icon: { fontSize: 22, fontWeight: '300', color: Colors.white, lineHeight: 24, marginTop: -2 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.muted },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { ...Typography.heading, color: Colors.white },
  body: { ...Typography.body, color: Colors.muted },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  stay: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayText: { fontSize: 13, fontWeight: '800', color: Colors.black, letterSpacing: 0.8, textTransform: 'uppercase' },
  leave: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveText: { fontSize: 13, fontWeight: '700', color: Colors.error, letterSpacing: 0.8, textTransform: 'uppercase' },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  disabled: { opacity: 0.4 },
})
