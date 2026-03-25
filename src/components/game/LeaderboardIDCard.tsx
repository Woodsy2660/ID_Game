import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface Props {
  rank: 1 | 2 | 3;
  playerName: string;
  score: number;
  delay?: number;
  size?: 'default' | 'large';
}

const RANK_CONFIG = {
  1: {
    colors: ['#B8860B', '#DAA520', '#FFD700', '#FFC200'] as const,
    offsetShadow: '#7A5500',
    shadowColor: 'rgba(255,215,0,0.3)',
    shadowV: 6,
    shadowBlur: 22,
    emoji: '\u{1F451}', // 👑
    label: '1ST PLACE',
  },
  2: {
    colors: ['#606060', '#989898', '#C8C8C8', '#ADADAD'] as const,
    offsetShadow: '#3C3C3C',
    shadowColor: 'rgba(140,140,140,0.2)',
    shadowV: 4,
    shadowBlur: 14,
    emoji: '\u{1F948}', // 🥈
    label: '2ND PLACE',
  },
  3: {
    colors: ['#6B3A10', '#9A5A22', '#CD7F32', '#B06820'] as const,
    offsetShadow: '#4A2A08',
    shadowColor: 'rgba(160,90,30,0.2)',
    shadowV: 4,
    shadowBlur: 14,
    emoji: '\u{1F949}', // 🥉
    label: '3RD PLACE',
  },
};

// Deterministic barcode bars
const BARCODE_HEIGHTS = [10, 5, 12, 8, 14, 6, 11, 9, 7, 13, 5, 10, 14, 8, 6, 12, 9, 11, 7, 13];

function PersonIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} fill="rgba(0,0,0,0.65)" />
      <Path
        d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
        stroke="rgba(0,0,0,0.65)"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function Barcode({ large }: { large?: boolean }) {
  const w = large ? 90 : 60;
  const h = large ? 18 : 14;
  const barW = large ? 2 : 1.5;
  const gap = large ? 4.5 : 3;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} opacity={0.22}>
      {BARCODE_HEIGHTS.map((bh, i) => {
        const scaled = large ? Math.round(bh * 1.28) : bh;
        return (
          <Rect
            key={i}
            x={i * gap}
            y={h - scaled}
            width={barW}
            height={scaled}
            fill="rgba(0,0,0,0.9)"
          />
        );
      })}
    </Svg>
  );
}

export function LeaderboardIDCard({ rank, playerName, score, delay = 0, size = 'default' }: Props) {
  const config = RANK_CONFIG[rank];
  const large = size === 'large';

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(400)}>
      <View style={[styles.wrapper, large && styles.wrapperLarge]}>
        {/* Offset shadow */}
        <View
          style={[
            styles.offsetShadow,
            { backgroundColor: config.offsetShadow },
          ]}
        />

        {/* Main card */}
        <LinearGradient
          colors={[...config.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              shadowColor: config.shadowColor,
              shadowOffset: { width: 0, height: config.shadowV },
              shadowOpacity: 1,
              shadowRadius: config.shadowBlur,
              elevation: 8,
            },
          ]}
        >
          {/* Inner border overlay */}
          <View style={styles.innerBorder} />

          {/* Top row: avatar+name on left, score on right */}
          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              <View style={[styles.avatar, large && styles.avatarLarge]}>
                <PersonIcon size={large ? 22 : 16} />
              </View>
              <View style={styles.nameBlock}>
                <Text style={[styles.rankLabel, large && styles.rankLabelLarge]}>{config.label}</Text>
                <Text style={[styles.playerName, large && styles.playerNameLarge]} numberOfLines={1}>
                  {playerName}
                </Text>
              </View>
            </View>
            <View style={styles.scoreBlock}>
              <Text style={[styles.scoreNumber, large && styles.scoreNumberLarge]}>{score}</Text>
              <Text style={[styles.ptsLabel, large && styles.ptsLabelLarge]}>PTS</Text>
            </View>
          </View>

          {/* Bottom row: barcode on left, emoji+watermark on right */}
          <View style={styles.bottomRow}>
            <Barcode large={large} />
            <View style={styles.bottomRight}>
              <Text style={[styles.emoji, large && styles.emojiLarge]}>{config.emoji}</Text>
              <Text style={[styles.watermark, large && styles.watermarkLarge]}>ID GAME</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: 171,
    height: 108,
  },
  wrapperLarge: {
    width: 210,
    height: 133,
  },
  offsetShadow: {
    position: 'absolute',
    top: 4,
    left: -4,
    right: 4,
    bottom: -4,
    borderRadius: 10,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  avatar: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    // borderRadius as 18% of width — approximate with large value
    overflow: 'hidden',
  },
  nameBlock: {
    flex: 1,
  },
  rankLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.42)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.82)',
    letterSpacing: -0.2,
  },
  scoreBlock: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.7)',
    lineHeight: 22,
  },
  ptsLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomRight: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 14,
  },
  watermark: {
    fontSize: 6,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.28)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 1,
  },
  // Large variant overrides
  avatarLarge: {
    width: '30%',
  },
  rankLabelLarge: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  playerNameLarge: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scoreNumberLarge: {
    fontSize: 24,
    lineHeight: 26,
  },
  ptsLabelLarge: {
    fontSize: 9,
    letterSpacing: 1.1,
  },
  emojiLarge: {
    fontSize: 16,
  },
  watermarkLarge: {
    fontSize: 7,
    letterSpacing: 0.8,
  },
});
