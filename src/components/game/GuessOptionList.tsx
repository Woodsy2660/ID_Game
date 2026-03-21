import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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
              <View style={[styles.numberBadge, isSelected && styles.numberBadgeSelected]}>
                <Text style={[styles.optionNumber, isSelected && styles.optionNumberSelected]}>
                  {index + 1}
                </Text>
              </View>
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
    borderColor: Colors.primary,
    backgroundColor: Colors.raised,
  },
  optionPressed: {
    backgroundColor: Colors.raised,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.xs,
    backgroundColor: Colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeSelected: {
    backgroundColor: Colors.primary,
  },
  optionNumber: {
    ...Typography.label,
    color: Colors.muted,
    lineHeight: 14,
  },
  optionNumberSelected: {
    color: Colors.black,
  },
  optionText: {
    ...Typography.body,
    color: Colors.white,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary,
  },
  optionTextDisabled: {
    color: Colors.muted,
  },
});
