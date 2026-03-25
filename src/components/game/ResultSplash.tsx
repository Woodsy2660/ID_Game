import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import type { RoundAnswer, Player } from '../../store/types';
import questionBank from '../../data/questionBank.json';

interface Props {
  questionId: number;
  qmName: string;
  answers: RoundAnswer[];
  players: Player[];
}

/**
 * Shows results after everyone has answered:
 * - The correct question revealed
 * - Each player's guess result (correct/wrong)
 */
export function ResultSplash({ questionId, qmName, answers, players }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const question = questionBank.find((q) => q.id === questionId);
  const correctCount = answers.filter((a) => a.isCorrect).length;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.revealCard}>
        <Text style={styles.label}>THE QUESTION WAS</Text>
        <Text style={styles.questionText}>{question?.text ?? ''}</Text>
        <Text style={styles.qmHint}>Asked about {qmName}</Text>
      </View>

      <Text style={styles.summaryText}>
        {correctCount} of {answers.length} guessed correctly
      </Text>

      <View style={styles.resultList}>
        {answers.map((answer) => {
          const player = players.find((p) => p.id === answer.playerId);
          const guessedQ = questionBank.find((q) => q.id === answer.guessedQuestionId);

          return (
            <View
              key={answer.playerId}
              style={[
                styles.resultRow,
                answer.isCorrect ? styles.resultCorrect : styles.resultWrong,
              ]}
            >
              <View style={styles.resultLeft}>
                <Text style={styles.playerName}>{player?.displayName ?? '???'}</Text>
                {!answer.isCorrect && guessedQ && (
                  <Text style={styles.guessText} numberOfLines={1}>
                    Guessed: {guessedQ.text}
                  </Text>
                )}
              </View>
              <Text style={[styles.resultBadge, answer.isCorrect ? styles.badgeCorrect : styles.badgeWrong]}>
                {answer.isCorrect ? '+1' : '0'}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xl,
  },
  revealCard: {
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
    color: Colors.primary,
  },
  questionText: {
    ...Typography.heading,
    color: Colors.white,
  },
  qmHint: {
    ...Typography.body,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  resultList: {
    gap: Spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  resultCorrect: {
    borderColor: Colors.success,
  },
  resultWrong: {
    borderColor: Colors.border,
  },
  resultLeft: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  guessText: {
    ...Typography.helper,
    fontSize: 12,
  },
  resultBadge: {
    ...Typography.heading,
    minWidth: 32,
    textAlign: 'center',
  },
  badgeCorrect: {
    color: Colors.success,
  },
  badgeWrong: {
    color: Colors.muted,
  },
});
