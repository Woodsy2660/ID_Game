import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

interface Props {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 99,
  },
  active: {
    width: 20,
    height: 6,
    backgroundColor: Colors.primary,
  },
  inactive: {
    width: 6,
    height: 6,
    backgroundColor: Colors.border,
  },
});
