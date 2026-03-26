import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logoImage = require('../../../assets/images/logo.png');

interface Props {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

/**
 * The ID Game logo — PNG image with optional "THE ID GAME" text.
 */
export function Logo({ size = 'medium', showText = true }: Props) {
  const iconSize = size === 'small' ? 48 : size === 'medium' ? 72 : 100;
  const textScale = size === 'small' ? 0.7 : size === 'medium' ? 1 : 1.3;
  const imgWidth = iconSize * 1.4;
  const imgHeight = iconSize;

  return (
    <View style={styles.container}>
      <Image
        source={logoImage}
        style={{ width: imgWidth, height: imgHeight }}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.textWhite, { fontSize: 28 * textScale }]}>THE ID </Text>
          <Text style={[styles.textGold, { fontSize: 28 * textScale }]}>GAME</Text>
        </View>
      )}
    </View>
  );
}

/** Icon-only version for app icon placeholder, loading screens etc. */
export function LogoIcon({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={logoImage}
      style={{ width: size * 1.4, height: size }}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWhite: {
    fontWeight: '900',
    color: Colors.white,
  },
  textGold: {
    fontWeight: '900',
    color: Colors.primary,
  },
});
