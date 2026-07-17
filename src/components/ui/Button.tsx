import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'inverted' | 'outlined';
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Chunky, pressable game button. A solid coloured bottom edge gives depth;
 * pressing nudges the face down toward the edge for a tactile "press" feel.
 * Cross-platform (native + web) — depth is a border, not a shadow.
 *
 *   primary   — gold fill, navy text (main CTA)
 *   secondary — white surface, navy text + navy edge
 *   inverted  — navy fill, light text
 *   outlined  — transparent, hairline border (low-emphasis)
 */
export function Button({ title, onPress, variant = 'primary', disabled, style }: Props) {
  const v = VARIANTS[variant];
  const isFlat = variant === 'outlined';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        !isFlat ? { borderBottomWidth: EDGE, borderBottomColor: v.edge } : null,
        pressed && !disabled ? styles.pressed : null,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: v.fg }]}>{title}</Text>
    </Pressable>
  );
}

const EDGE = 4;

const VARIANTS = {
  primary:   { bg: Colors.primary, fg: Colors.onPrimary, edge: Colors.primaryEdge,  border: '' },
  secondary: { bg: Colors.surface, fg: Colors.navy,      edge: Colors.navyEdge,      border: Colors.navy },
  inverted:  { bg: Colors.navy,    fg: Colors.onNavy,    edge: Colors.navyEdge,      border: '' },
  outlined:  { bg: 'transparent',  fg: Colors.inkSoft,   edge: '',                   border: Colors.borderStrong },
} as const;

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: 15,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.94,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
