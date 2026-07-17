import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Mono } from '../../theme';

interface Props {
  label: string;
  variant?: 'primary' | 'tertiary' | 'muted' | 'error';
}

/**
 * Stamp-style badge — a small ruled, monospace chip in the license aesthetic
 * (HOST, QM, etc). Slight rotation gives the "approval stamp" feel.
 */
export function Badge({ label, variant = 'primary' }: Props) {
  const v = VARIANTS[variant];
  return (
    <View style={[styles.base, { borderColor: v.border, backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.fg }]}>{label}</Text>
    </View>
  );
}

const VARIANTS = {
  primary:   { bg: Colors.primary,     fg: Colors.onPrimary, border: Colors.primaryEdge },
  tertiary:  { bg: Colors.tertiary,    fg: Colors.onNavy,    border: Colors.tertiaryDim },
  muted:     { bg: 'transparent',      fg: Colors.inkSoft,   border: Colors.borderStrong },
  error:     { bg: Colors.errorMuted,  fg: Colors.error,     border: Colors.error },
} as const;

const styles = StyleSheet.create({
  base: {
    minHeight: 24,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    transform: [{ rotate: '-2deg' }],
  },
  text: {
    fontFamily: Mono,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
