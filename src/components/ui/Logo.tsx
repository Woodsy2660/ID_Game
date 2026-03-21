import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  G,
  Circle,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, Spacing } from '../../theme';

interface Props {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

/**
 * The ID Game logo — two stacked ID cards (gold P1 on top, navy P2 behind)
 * with optional "THE ID GAME" text.
 */
export function Logo({ size = 'medium', showText = true }: Props) {
  const iconSize = size === 'small' ? 48 : size === 'medium' ? 72 : 100;
  const textScale = size === 'small' ? 0.7 : size === 'medium' ? 1 : 1.3;

  return (
    <View style={styles.container}>
      <IDCardIcon size={iconSize} />
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.textWhite, { fontSize: 28 * textScale }]}>THE ID </Text>
          <Text style={[styles.textGold, { fontSize: 28 * textScale }]}>GAME</Text>
        </View>
      )}
    </View>
  );
}

function IDCardIcon({ size }: { size: number }) {
  const w = size * 1.4;
  const h = size;

  return (
    <Svg width={w} height={h} viewBox="0 0 140 100">
      {/* Navy card (behind, rotated slightly) */}
      <G transform="translate(20, 15) rotate(-8, 60, 40)">
        <Rect
          x="0"
          y="0"
          width="110"
          height="72"
          rx="10"
          fill={Colors.secondary}
        />
        {/* P2 label */}
        <SvgText
          x="82"
          y="62"
          fontSize="16"
          fontWeight="700"
          fill="#5C6BC0"
        >
          P2
        </SvgText>
      </G>

      {/* Gold card (front, slightly rotated) */}
      <G transform="translate(8, 8) rotate(-4, 55, 36)">
        <Rect
          x="0"
          y="0"
          width="110"
          height="72"
          rx="10"
          fill={Colors.primary}
        />

        {/* P1 label */}
        <SvgText
          x="10"
          y="24"
          fontSize="16"
          fontWeight="800"
          fill="#FFFFFF"
        >
          P1
        </SvgText>

        {/* Profile photo square */}
        <Rect
          x="72"
          y="8"
          width="30"
          height="30"
          rx="4"
          fill="#FFFFFF"
        />
        {/* Person icon (head) */}
        <Circle cx="87" cy="18" r="6" fill={Colors.primaryDim} />
        {/* Person icon (body) */}
        <Path
          d="M79 34 C79 28, 95 28, 95 34"
          fill={Colors.primaryDim}
        />

        {/* Text lines on card */}
        <Rect x="10" y="42" width="52" height="6" rx="3" fill={Colors.primaryDim} opacity={0.5} />
        <Rect x="10" y="54" width="36" height="6" rx="3" fill={Colors.primaryDim} opacity={0.5} />
      </G>
    </Svg>
  );
}

/** Icon-only version for app icon placeholder, loading screens etc. */
export function LogoIcon({ size = 72 }: { size?: number }) {
  return <IDCardIcon size={size} />;
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
