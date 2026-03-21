import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';

interface Props {
  rank: number;
  playerName: string;
  score: number;
  isLocal: boolean;
  isQM?: boolean;
}

export function PlayerScoreCard({ rank, playerName, score, isLocal, isQM }: Props) {
  const isTop = rank === 1;

  return (
    <Animated.View entering={FadeIn.delay(rank * 80).duration(300)}>
      <View style={[styles.row, isLocal && styles.rowLocal, isTop && styles.rowTop]}>
        <Text style={[styles.rank, isTop && styles.rankTop]}>
          {rank}
        </Text>
        <View style={styles.info}>
          <Text style={[styles.name, isTop && styles.nameTop]}>
            {playerName}
            {isLocal ? ' (You)' : ''}
          </Text>
          {isQM && <Text style={styles.qmBadge}>QM</Text>}
        </View>
        <Text style={[styles.score, isTop && styles.scoreTop]}>
          {score}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  rowLocal: {
    borderColor: Colors.amber,
  },
  rowTop: {
    backgroundColor: Colors.raised,
    borderColor: Colors.amber,
  },
  rank: {
    ...Typography.heading,
    color: Colors.muted,
    width: 28,
    textAlign: 'center',
  },
  rankTop: {
    color: Colors.amber,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  nameTop: {
    color: Colors.amber,
  },
  qmBadge: {
    ...Typography.label,
    color: Colors.muted,
    fontSize: 9,
  },
  score: {
    ...Typography.heading,
    color: Colors.white,
    minWidth: 32,
    textAlign: 'right',
  },
  scoreTop: {
    color: Colors.amber,
  },
});
