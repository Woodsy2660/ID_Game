import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';
import { PACK_IDS, PACK_META } from '../../data/packs';
import type { PackId } from '../../store/types';

interface Props {
  selected: PackId;
  onSelect: (pack: PackId) => void;
}

/** Per-pack accent colours for the icon tiles (chunky, game-card feel). */
const PACK_STYLE: Record<PackId, { tile: string; edge: string }> = {
  boys: { tile: '#2F6FED', edge: '#1E52C4' },
  girls: { tile: '#E85B96', edge: '#C43E76' },
  infamous: { tile: '#CC3149', edge: '#A01E33' },
};

/** White line-icons drawn per pack: Mars ♂ / Venus ♀ / flame. */
function PackIcon({ id }: { id: PackId }) {
  const s = { stroke: '#FFFFFF', strokeWidth: 2.1, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (id === 'boys') {
    return (
      <Svg width={30} height={30} viewBox="0 0 24 24">
        <Circle cx={9.5} cy={14.5} r={5.8} {...s} />
        <Path d="M14 10 L20 4" {...s} />
        <Path d="M15 4 H20 V9" {...s} />
      </Svg>
    );
  }
  if (id === 'girls') {
    return (
      <Svg width={30} height={30} viewBox="0 0 24 24">
        <Circle cx={12} cy={8.5} r={5.8} {...s} />
        <Path d="M12 14.3 V22 M8.4 18.2 H15.6" {...s} />
      </Svg>
    );
  }
  // infamous — flame
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24">
      <Path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        {...s}
      />
    </Svg>
  );
}

/**
 * Host-only pack picker on the create screen. The pack is fixed for the whole
 * game. "The Infamous Original" is shown but is never the default selection.
 */
export function PackSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>CHOOSE YOUR PACK</Text>
      {PACK_IDS.map((id) => {
        const meta = PACK_META[id];
        const accent = PACK_STYLE[id];
        const isSel = selected === id;
        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSel }}
            style={({ pressed }) => [
              styles.card,
              Shadow.soft,
              isSel && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            {/* Icon tile with chunky bottom edge */}
            <View style={[styles.tile, { backgroundColor: accent.tile, borderBottomColor: accent.edge }]}>
              <PackIcon id={id} />
            </View>

            {/* Text */}
            <View style={styles.cardText}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{meta.name}</Text>
                {meta.mature && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>18+</Text>
                  </View>
                )}
              </View>
              <Text style={styles.blurb}>{meta.blurb}</Text>
            </View>

            {/* Select stamp */}
            <View style={[styles.check, isSel && styles.checkSelected]}>
              {isSel && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  label: { ...Typography.label, marginBottom: Spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderBottomWidth: 5,
    borderBottomColor: Colors.primaryEdge,
    backgroundColor: Colors.primaryMuted,
  },
  cardPressed: { transform: [{ translateY: 1 }], opacity: 0.92 },

  tile: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  },

  cardText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: 18, fontWeight: '800', color: Colors.ink, letterSpacing: -0.3, flexShrink: 1 },
  badge: {
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: Radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: Colors.error },
  blurb: { ...Typography.helper, lineHeight: 18 },

  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  checkMark: { color: Colors.onPrimary, fontSize: 15, fontWeight: '900', lineHeight: 17 },
});
