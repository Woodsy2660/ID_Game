import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import type { RoundAnswer, Player, PackId } from '../../store/types';
import { findQuestion } from '../../data/packs';

interface Props {
  questionId: number;
  qmName: string;
  answers: RoundAnswer[];
  players: Player[];
  pack: PackId | null;
}

/**
 * Shows results after everyone has answered:
 * - The correct question revealed
 * - Each player's guess result (correct/wrong)
 */
export function ResultSplash({ questionId, qmName, answers, players, pack }: Props) {
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

  const question = findQuestion(pack, questionId);
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
          const guessedQ = findQuestion(pack, answer.guessedQuestionId);

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
    backgroundColor: Colors.navy,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.sm,
    borderBottomWidth: 5,
    borderBottomColor: Colors.navyEdge,
  },
  label: {
    ...Typography.label,
    color: Colors.primary,
  },
  questionText: {
    ...Typography.heading,
    color: Colors.onNavy,
  },
  qmHint: {
    ...Typography.body,
    color: 'rgba(245,247,255,0.7)',
    marginTop: Spacing.xs,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.inkSoft,
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
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadow.soft,
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
    color: Colors.ink,
    fontWeight: '700',
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
