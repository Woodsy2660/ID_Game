import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import questionBank from '../../data/questionBank.json';

interface Props {
  /** The 10 visible question IDs to show as options */
  visibleQuestionIds: number[];
  /** Called with the selected question ID when the player taps an option */
  onSelect: (questionId: number) => void;
  /** Whether submissions are locked (already submitted) */
  disabled?: boolean;
  /** The ID the player already selected (for highlighting) */
  selectedId?: number | null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GuessOptionList({ visibleQuestionIds, onSelect, disabled, selectedId }: Props) {
  const questions = visibleQuestionIds.map((id) => {
    const q = questionBank.find((q) => q.id === id);
    return { id, text: q?.text ?? 'Unknown question' };
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {questions.map((q, index) => {
        const isSelected = selectedId === q.id;

        return (
          <Animated.View
            key={q.id}
            entering={FadeIn.delay(index * 50).duration(300)}
          >
            <Pressable
              onPress={() => !disabled && onSelect(q.id)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && !disabled && styles.optionPressed,
                disabled && !isSelected && styles.optionDisabled,
              ]}
            >
              <Text style={styles.optionNumber}>{index + 1}</Text>
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  disabled && !isSelected && styles.optionTextDisabled,
                ]}
                numberOfLines={2}
              >
                {q.text}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },
  option: {
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
  optionSelected: {
    borderColor: Colors.amber,
    backgroundColor: Colors.raised,
  },
  optionPressed: {
    backgroundColor: Colors.raised,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionNumber: {
    ...Typography.label,
    color: Colors.muted,
    width: 20,
    textAlign: 'center',
  },
  optionText: {
    ...Typography.body,
    color: Colors.white,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.amber,
  },
  optionTextDisabled: {
    color: Colors.muted,
  },
});
