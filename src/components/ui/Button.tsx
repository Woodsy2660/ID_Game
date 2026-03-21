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
 * Button — 4 variants matching the design system:
 *   primary:  Gold bg, dark text (main CTA)
 *   secondary: Outlined with border, white text
 *   inverted: White bg, dark text
 *   outlined: Transparent bg, border, muted text
 */
export function Button({ title, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, labelStyles[variant]]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  pressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primaryDim,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inverted: {
    backgroundColor: Colors.white,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.muted,
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: Colors.black,
  },
  secondary: {
    color: Colors.white,
  },
  inverted: {
    color: Colors.black,
  },
  outlined: {
    color: Colors.muted,
  },
});
