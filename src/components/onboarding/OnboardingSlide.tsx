import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../theme';

interface Props {
  title: string;
  body: string;
  visual: React.ReactNode;
  width: number;
  height: number;
  centerText?: boolean;
}

export function OnboardingSlide({ title, body, visual, width, height, centerText }: Props) {
  if (centerText) {
    return (
      <View style={[styles.slide, { width, height }]}>
        <View style={styles.centeredTextArea}>
          <Text style={[styles.title, styles.centeredTitle]}>{title}</Text>
          <Text style={[styles.body, styles.centeredBody]}>{body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.slide, { width, height }]}>
      <View style={styles.visualArea}>{visual}</View>
      <View style={styles.textArea}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flexDirection: 'column',
    overflow: 'hidden',
  },
  visualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textArea: {
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.muted,
    lineHeight: 22,
  },
  centeredTextArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.sm,
  },
  centeredTitle: {
    textAlign: 'center',
  },
  centeredBody: {
    textAlign: 'center',
  },
});
