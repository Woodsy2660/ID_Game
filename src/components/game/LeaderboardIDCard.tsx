import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Colors, Mono } from '../../theme';

interface Props {
  rank: 1 | 2 | 3;
  playerName: string;
  score: number;
  delay?: number;
  size?: 'default' | 'large';
}

/**
 * A player's standing rendered as a flat "ID card" in the app's license style:
 * a photo box, a rank medal, a mono license line, a score field and a barcode,
 * with a solid drop-edge for depth (matching the chunky buttons).
 *
 *   1st — gold card, navy ink (the champion / hero card)
 *   2nd — white card, silver accents
 *   3rd — white card, bronze accents
 */
const RANK = {
  1: {
    cardBg: Colors.primary,
    edge: Colors.navyEdge,
    ink: Colors.onPrimary,
    sub: 'rgba(19,35,96,0.55)',
    photoBg: 'rgba(19,35,96,0.16)',
    photoInk: 'rgba(19,35,96,0.7)',
    medalBg: Colors.navy,
    medalInk: Colors.primary,
    barcode: 'rgba(19,35,96,0.55)',
    label: '1ST PLACE',
    emoji: '\u{1F451}', // 👑
  },
  2: {
    cardBg: Colors.surface,
    edge: '#9BA3B4',
    ink: Colors.ink,
    sub: Colors.inkSoft,
    photoBg: '#EDEFF3',
    photoInk: '#8A94A6',
    medalBg: '#B8C0CE',
    medalInk: '#3A4356',
    barcode: 'rgba(19,35,96,0.35)',
    label: '2ND PLACE',
    emoji: '\u{1F948}', // 🥈
  },
  3: {
    cardBg: Colors.surface,
    edge: '#B47A44',
    ink: Colors.ink,
    sub: Colors.inkSoft,
    photoBg: '#F3E7DB',
    photoInk: '#B47A44',
    medalBg: '#D79A63',
    medalInk: '#5A3413',
    barcode: 'rgba(19,35,96,0.35)',
    label: '3RD PLACE',
    emoji: '\u{1F949}', // 🥉
  },
} as const;

const BARCODE_HEIGHTS = [10, 5, 12, 8, 14, 6, 11, 9, 7, 13, 5, 10, 14, 8, 6, 12, 9, 11, 7, 13];

function PersonIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} fill={color} />
      <Path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function Barcode({ large, color }: { large?: boolean; color: string }) {
  const w = large ? 96 : 66;
  const h = large ? 20 : 15;
  const barW = large ? 2 : 1.5;
  const gap = large ? 4.6 : 3.2;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {BARCODE_HEIGHTS.map((bh, i) => {
        const scaled = large ? Math.round(bh * 1.32) : bh;
        return <Rect key={i} x={i * gap} y={h - scaled} width={barW} height={scaled} fill={color} />;
      })}
    </Svg>
  );
}

export function LeaderboardIDCard({ rank, playerName, score, delay = 0, size = 'default' }: Props) {
  const c = RANK[rank];
  const large = size === 'large';

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(420)}>
      <View
        style={[
          styles.card,
          large && styles.cardLarge,
          { backgroundColor: c.cardBg, borderBottomColor: c.edge },
        ]}
      >
        {/* Top row: photo + name/license, score on the right */}
        <View style={styles.topRow}>
          <View style={[styles.photo, large && styles.photoLarge, { backgroundColor: c.photoBg }]}>
            <PersonIcon size={large ? 26 : 20} color={c.photoInk} />
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.medalRow}>
              <View style={[styles.medal, { backgroundColor: c.medalBg }]}>
                <Text style={[styles.medalText, { color: c.medalInk }]}>{rank}</Text>
              </View>
              <Text style={[styles.rankLabel, large && styles.rankLabelLarge, { color: c.sub }]}>
                {c.label}
              </Text>
            </View>
            <Text style={[styles.playerName, large && styles.playerNameLarge, { color: c.ink }]} numberOfLines={1}>
              {playerName}
            </Text>
          </View>

          <View style={styles.scoreBlock}>
            <Text style={[styles.score, large && styles.scoreLarge, { color: c.ink }]}>{score}</Text>
            <Text style={[styles.pts, { color: c.sub }]}>PTS</Text>
          </View>
        </View>

        {/* Bottom row: barcode + medal emoji + watermark */}
        <View style={styles.bottomRow}>
          <Barcode large={large} color={c.barcode} />
          <View style={styles.bottomRight}>
            <Text style={[styles.emoji, large && styles.emojiLarge]}>{c.emoji}</Text>
            <Text style={[styles.watermark, { color: c.sub }]}>ID GAME</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 5,
    justifyContent: 'space-between',
  },
  cardLarge: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 18,
    borderBottomWidth: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photo: {
    width: 40,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLarge: { width: 54, height: 64, borderRadius: 10 },
  nameBlock: { flex: 1, gap: 3 },
  medalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  medal: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { fontFamily: Mono, fontSize: 11, fontWeight: '800' },
  rankLabel: { fontFamily: Mono, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  rankLabelLarge: { fontSize: 10, letterSpacing: 1.4 },
  playerName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  playerNameLarge: { fontSize: 21 },
  scoreBlock: { alignItems: 'flex-end' },
  score: { fontFamily: Mono, fontSize: 24, fontWeight: '800', lineHeight: 26 },
  scoreLarge: { fontSize: 34, lineHeight: 36 },
  pts: { fontFamily: Mono, fontSize: 9, fontWeight: '700', letterSpacing: 1.4, marginTop: 1 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bottomRight: { alignItems: 'center', gap: 1 },
  emoji: { fontSize: 16 },
  emojiLarge: { fontSize: 20 },
  watermark: { fontFamily: Mono, fontSize: 7, fontWeight: '700', letterSpacing: 1 },
});
