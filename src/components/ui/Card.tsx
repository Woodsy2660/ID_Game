import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';

interface Props {
  children: React.ReactNode;
  highlighted?: boolean;
  style?: ViewStyle;
}

export function Card({ children, highlighted, style }: Props) {
  return (
    <View style={[styles.base, highlighted && styles.highlighted, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
  },
  highlighted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.raised,
  },
});
