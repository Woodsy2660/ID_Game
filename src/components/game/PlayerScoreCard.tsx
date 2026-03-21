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
        <View style={[styles.rankBadge, isTop && styles.rankBadgeTop]}>
          <Text style={[styles.rank, isTop && styles.rankTop]}>
            {rank}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isTop && styles.nameTop]}>
            {playerName}
            {isLocal ? ' (You)' : ''}
          </Text>
          {isQM && (
            <View style={styles.qmTag}>
              <Text style={styles.qmBadge}>QM</Text>
            </View>
          )}
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
    borderColor: Colors.primary,
  },
  rowTop: {
    backgroundColor: Colors.raised,
    borderColor: Colors.primary,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    backgroundColor: Colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: Colors.primary,
  },
  rank: {
    ...Typography.heading,
    color: Colors.muted,
    fontSize: 14,
  },
  rankTop: {
    color: Colors.black,
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
    color: Colors.primary,
  },
  qmTag: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  qmBadge: {
    ...Typography.label,
    color: Colors.white,
    fontSize: 9,
    lineHeight: 12,
  },
  score: {
    ...Typography.heading,
    color: Colors.white,
    minWidth: 32,
    textAlign: 'right',
  },
  scoreTop: {
    color: Colors.primary,
  },
});
