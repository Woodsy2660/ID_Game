import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

interface Props {
  progress: number; // 0–1
  color?: string;
}

export function ProgressBar({ progress, color }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color ?? Colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.sm,
  },
});
