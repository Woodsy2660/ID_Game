import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';

interface Props {
  label: string;
  variant?: 'primary' | 'tertiary' | 'muted' | 'error';
}

export function Badge({ label, variant = 'primary' }: Props) {
  const isDark = variant === 'primary' || variant === 'tertiary';

  return (
    <View style={[styles.base, variantBg[variant]]}>
      <Text style={[styles.text, isDark ? styles.textDark : styles.textLight]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 24,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
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

const variantBg = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
  },
  tertiary: {
    backgroundColor: Colors.tertiary,
  },
  muted: {
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  error: {
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
});
