import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Layout, Shadow } from '../../theme';

interface Props {
  children: React.ReactNode;
  highlighted?: boolean;
  style?: ViewStyle;
}

/** White surface card with a soft navy-tinted shadow. `highlighted` = gold frame. */
export function Card({ children, highlighted, style }: Props) {
  return (
    <View style={[styles.base, Shadow.soft, highlighted && styles.highlighted, style]}>
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
    padding: Layout.cardPadding,
  },
  highlighted: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.surface,
  },
});
