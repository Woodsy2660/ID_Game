import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../theme';

interface Props {
  isActive: boolean;
  reduceMotion: boolean;
}

export function OnboardingVisualHaveFun(_props: Props) {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
