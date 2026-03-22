import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius } from '../../../theme';

const CARD_W = 200;
const CARD_H = 42;
const GAP = 10;
const STEP = CARD_H + GAP;

// Initial display order → final ranked order
// P3 → rank 0 (most likely), P1 → rank 1, P4 → rank 2, P2 → rank 3
const CARDS = [
  { id: 'P1', initialRank: 0, finalRank: 1, isTopAfterSort: false },
  { id: 'P2', initialRank: 1, finalRank: 3, isTopAfterSort: false },
  { id: 'P3', initialRank: 2, finalRank: 0, isTopAfterSort: true },
  { id: 'P4', initialRank: 3, finalRank: 2, isTopAfterSort: false },
];

const SPRING_CONFIG = { damping: 18, stiffness: 80 };
const SORT_DELAY = 1100;

interface Props {
  isActive: boolean;
  reduceMotion: boolean;
}

export function OnboardingVisualRanking({ isActive, reduceMotion }: Props) {
  const p1Y = useSharedValue(0 * STEP);
  const p2Y = useSharedValue(1 * STEP);
  const p3Y = useSharedValue(2 * STEP);
  const p4Y = useSharedValue(3 * STEP);
  const cardOpacity = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);

  const yValues = [p1Y, p2Y, p3Y, p4Y];
  const initialRanks = CARDS.map((c) => c.initialRank);
  const finalRanks = CARDS.map((c) => c.finalRank);

  useEffect(() => {
    if (isActive) {
      // Reset to initial positions
      yValues.forEach((yv, i) => { yv.value = initialRanks[i] * STEP; });
      badgeOpacity.value = 0;

      if (reduceMotion) {
        cardOpacity.value = 1;
        yValues.forEach((yv, i) => { yv.value = finalRanks[i] * STEP; });
        badgeOpacity.value = 1;
        return;
      }

      cardOpacity.value = withTiming(1, { duration: 500 });

      // Stagger the reorder
      yValues.forEach((yv, i) => {
        yv.value = withDelay(
          SORT_DELAY + i * 100,
          withSpring(finalRanks[i] * STEP, SPRING_CONFIG)
        );
      });

      badgeOpacity.value = withDelay(SORT_DELAY + 900, withTiming(1, { duration: 450 }));
    } else {
      cardOpacity.value = 0;
      badgeOpacity.value = 0;
      yValues.forEach((yv, i) => { yv.value = initialRanks[i] * STEP; });
    }
  }, [isActive]);

  const p1Style = useAnimatedStyle(() => ({ transform: [{ translateY: p1Y.value }] }));
  const p2Style = useAnimatedStyle(() => ({ transform: [{ translateY: p2Y.value }] }));
  const p3Style = useAnimatedStyle(() => ({ transform: [{ translateY: p3Y.value }] }));
  const p4Style = useAnimatedStyle(() => ({ transform: [{ translateY: p4Y.value }] }));
  const cardStyles = [p1Style, p2Style, p3Style, p4Style];

  const containerOpacityStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));
  const badgeStyle = useAnimatedStyle(() => ({ opacity: badgeOpacity.value }));

  const containerH = 4 * CARD_H + 3 * GAP;

  return (
    <View style={styles.outer}>
      <Text style={styles.labelTop}>Most likely</Text>
      <Animated.View style={[styles.cardContainer, { height: containerH }, containerOpacityStyle]}>
        {CARDS.map((card, i) => (
          <Animated.View
            key={card.id}
            style={[styles.card, card.isTopAfterSort && styles.cardTop, cardStyles[i]]}
          >
            {card.isTopAfterSort && (
              <Animated.View style={[styles.rankBadge, badgeStyle]}>
                <Text style={styles.rankBadgeText}>1</Text>
              </Animated.View>
            )}
            <Text style={[styles.cardLabel, card.isTopAfterSort && styles.cardLabelTop]}>
              {card.id}
            </Text>
          </Animated.View>
        ))}
      </Animated.View>
      <Text style={styles.labelBottom}>Least likely</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    gap: 10,
  },
  labelTop: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.tertiary,
  },
  labelBottom: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  cardContainer: {
    width: CARD_W,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CARD_H,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  cardTop: {
    borderColor: Colors.primary,
    borderLeftWidth: 3,
    backgroundColor: Colors.raised,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  cardLabelTop: {
    color: Colors.primary,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.black,
  },
});
