import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Layout } from '../../theme/spacing';

interface Props {
  children: React.ReactNode;
  centered?: boolean;
  style?: ViewStyle;
  overlay?: React.ReactNode;
}

export function ScreenContainer({ children, centered, style, overlay }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      {overlay}
      <View style={[styles.container, centered && styles.centered, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: Layout.screenPaddingBottom,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
