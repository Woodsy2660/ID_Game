import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

interface Props {
  progress: number; // 0–1
}

export function ProgressBar({ progress }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: Colors.raised,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.amber,
    borderRadius: Radius.sm,
  },
});
