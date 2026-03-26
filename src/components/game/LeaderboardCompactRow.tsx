import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

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
        <Text style={styles.rank}>{rank}</Text>
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
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rank: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    width: 16,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#cccccc',
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666666',
    minWidth: 28,
    textAlign: 'right',
  },
});
