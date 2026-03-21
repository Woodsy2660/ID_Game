import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { ProgressBar } from '../ui/ProgressBar';

interface Props {
  submitted: number;
  total: number;
  playerNames?: string[];
}

/**
 * Shows submission progress: "3 / 5 answered" with a progress bar.
 * Used on the QM screen during answer_phase.
 */
export function SubmissionTracker({ submitted, total, playerNames }: Props) {
  const progress = total > 0 ? submitted / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>ANSWERS IN</Text>
        <Text style={styles.count}>
          <Text style={styles.countHighlight}>{submitted}</Text>
          <Text style={styles.countMuted}> / {total}</Text>
        </Text>
      </View>
      <ProgressBar progress={progress} />
      {playerNames && playerNames.length > 0 && (
        <View style={styles.names}>
          {playerNames.map((name, i) => (
            <View key={i} style={styles.dot}>
              <View style={[styles.indicator, i < submitted && styles.indicatorActive]} />
              <Text style={[styles.name, i < submitted && styles.nameActive]}>
                {name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.label,
    color: Colors.muted,
  },
  count: {
    ...Typography.heading,
  },
  countHighlight: {
    color: Colors.amber,
  },
  countMuted: {
    color: Colors.muted,
  },
  names: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  indicatorActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  name: {
    ...Typography.body,
    color: Colors.muted,
  },
  nameActive: {
    color: Colors.white,
  },
});
