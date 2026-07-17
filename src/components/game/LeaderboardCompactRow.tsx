import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Mono, Shadow } from '../../theme';

interface Props {
  rank: number;
  playerName: string;
  score: number;
  delay?: number;
}

export function LeaderboardCompactRow({ rank, playerName, score, delay = 0 }: Props) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(300)}>
      <View style={styles.row}>
        <Text style={styles.rank}>{String(rank).padStart(2, '0')}</Text>
        <Text style={styles.name} numberOfLines={1}>{playerName}</Text>
        <Text style={styles.score}>{score}</Text>
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
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    ...Shadow.soft,
  },
  rank: {
    fontFamily: Mono,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkSoft,
    width: 24,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  score: {
    fontFamily: Mono,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
    minWidth: 28,
    textAlign: 'right',
  },
});
