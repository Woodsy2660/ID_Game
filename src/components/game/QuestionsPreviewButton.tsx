import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';

interface Props {
  onPress: () => void;
}

export function QuestionsPreviewButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>Sneak peek the questions 👀</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.white,
  },
});
