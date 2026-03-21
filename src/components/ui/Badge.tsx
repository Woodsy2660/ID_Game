import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';

interface Props {
  label: string;
  variant?: 'amber' | 'muted' | 'error';
}

export function Badge({ label, variant = 'amber' }: Props) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, variant === 'amber' ? styles.textDark : styles.textLight]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 24,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  amber: {
    backgroundColor: Colors.amber,
  },
  muted: {
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  error: {
    backgroundColor: 'rgba(232, 69, 69, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 69, 69, 0.25)',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textDark: {
    color: Colors.black,
  },
  textLight: {
    color: Colors.muted,
  },
});
