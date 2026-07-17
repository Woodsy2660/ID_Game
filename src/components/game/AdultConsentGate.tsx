import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../../theme';
import { ADULT_WARNING_TEXT, ADULT_CONFIRM_LABEL } from '../../data/packs';

interface Props {
  visible: boolean;
  loading?: boolean;
  /** Called with the current warning version once the box is ticked and confirmed. */
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The 18+ content gate for the mature ("The Infamous Original") pack.
 *
 * Every player — including the host — must independently tick the box and
 * confirm before entering. The confirmation itself is recorded server-side
 * (timestamp + warning version) by the create-room / join-room functions; this
 * component only collects the tick. No date of birth or ID is ever requested.
 */
export function AdultConsentGate({ visible, loading, onConfirm, onCancel }: Props) {
  const [checked, setChecked] = useState(false);

  // Reset the tick each time the gate is (re)shown so it can never be
  // pre-satisfied by a previous session.
  useEffect(() => {
    if (visible) setChecked(false);
  }, [visible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onCancel]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.stampRow}>
            <Text style={styles.stamp}>18+</Text>
            <Text style={styles.packName}>The Infamous Original</Text>
          </View>

          <Text style={styles.warning}>{ADULT_WARNING_TEXT}</Text>

          <Pressable
            style={styles.checkRow}
            onPress={() => setChecked((c) => !c)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
          >
            <View style={[styles.box, checked && styles.boxChecked]}>
              {checked && <Text style={styles.tick}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>{ADULT_CONFIRM_LABEL}</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              onPress={onConfirm}
              disabled={!checked || loading}
              style={({ pressed }) => [
                styles.enterBtn,
                (!checked || loading) && styles.enterDisabled,
                pressed && checked && !loading && styles.enterPressed,
              ]}
            >
              <Text style={styles.enterText}>{loading ? 'ENTERING…' : 'ENTER'}</Text>
            </Pressable>

            <TouchableOpacity onPress={onCancel} disabled={loading} style={styles.cancelBtn} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stamp: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.error,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ rotate: '-3deg' }],
  },
  packName: {
    ...Typography.heading,
    color: Colors.ink,
  },
  warning: {
    ...Typography.body,
    color: Colors.white,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    minHeight: 44,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: Radius.xs,
    borderWidth: 2,
    borderColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tick: {
    color: Colors.black,
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 18,
  },
  checkLabel: {
    ...Typography.body,
    color: Colors.white,
    flex: 1,
    fontWeight: '600',
  },
  actions: {
    gap: Spacing.sm,
  },
  enterBtn: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterPressed: { transform: [{ translateY: 2 }], opacity: 0.9 },
  enterDisabled: { opacity: 0.35 },
  enterText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.black,
    textTransform: 'uppercase',
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Typography.body,
    color: Colors.muted,
    fontWeight: '600',
  },
});
