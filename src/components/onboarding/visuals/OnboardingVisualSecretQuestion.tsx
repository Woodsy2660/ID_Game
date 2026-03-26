import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, Radius } from '../../../theme';

const PLAYER_CARD_W = 54;
const PLAYER_CARD_H = 36;
const Q_CARD_W = 84;
const Q_CARD_H = 54;
const ROW_GAP = 8;

const PLAYERS = [
  { id: 'P1', isHighlighted: false },
  { id: 'P2', isHighlighted: true },
  { id: 'P3', isHighlighted: false },
  { id: 'P4', isHighlighted: false },
];

interface Props {
  isActive: boolean;
  reduceMotion: boolean;
}

export function OnboardingVisualSecretQuestion({ isActive, reduceMotion }: Props) {
  const p1Opacity = useSharedValue(0);
  const p2Opacity = useSharedValue(0);
  const p3Opacity = useSharedValue(0);
  const p4Opacity = useSharedValue(0);
  const qCardY = useSharedValue(-120);
  const qCardOpacity = useSharedValue(0);
  const sweepX = useSharedValue(-Q_CARD_W);

  const opacities = [p1Opacity, p2Opacity, p3Opacity, p4Opacity];
  const targetOpacities = [0.35, 1, 0.35, 0.35];

  useEffect(() => {
    if (isActive) {
      if (reduceMotion) {
        opacities.forEach((op, i) => { op.value = targetOpacities[i]; });
        qCardY.value = 0;
        qCardOpacity.value = 1;
        sweepX.value = Q_CARD_W * 2;
        return;
      }
      PLAYERS.forEach((_, i) => {
        opacities[i].value = withDelay(
          i * 100,
          withTiming(targetOpacities[i], { duration: 450 })
        );
      });
      qCardOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
      qCardY.value = withDelay(
        500,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
      );
      // Sweep bar wipes across the question card after it settles
      sweepX.value = withDelay(
        1300,
        withTiming(Q_CARD_W * 2, { duration: 600, easing: Easing.inOut(Easing.ease) })
      );
    } else {
      opacities.forEach((op) => { op.value = 0; });
      qCardY.value = -120;
      qCardOpacity.value = 0;
      sweepX.value = -Q_CARD_W;
    }
  }, [isActive]);

  const p1Style = useAnimatedStyle(() => ({ opacity: p1Opacity.value }));
  const p2Style = useAnimatedStyle(() => ({ opacity: p2Opacity.value }));
  const p3Style = useAnimatedStyle(() => ({ opacity: p3Opacity.value }));
  const p4Style = useAnimatedStyle(() => ({ opacity: p4Opacity.value }));
  const playerStyles = [p1Style, p2Style, p3Style, p4Style];

  const qCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: qCardY.value }],
    opacity: qCardOpacity.value,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweepX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Question card */}
      <Animated.View style={[styles.questionCard, qCardStyle]}>
        <View style={styles.questionCardInner}>
          <Text style={styles.questionMark}>?</Text>
          {/* Sweep bar overlay */}
          <Animated.View style={[styles.sweepBar, sweepStyle]} />
        </View>
      </Animated.View>

      {/* Spacer between q card and player row */}
      <View style={styles.gap} />

      {/* Player icons row */}
      <View style={styles.playerRow}>
        {PLAYERS.map((p, i) => (
          <Animated.View
            key={p.id}
            style={[styles.playerItem, playerStyles[i]]}
          >
            <View style={[styles.avatarCircle, p.isHighlighted && styles.avatarCircleHighlighted]}>
              {/* Head */}
              <View style={[styles.avatarHead, p.isHighlighted && styles.avatarPartHighlighted]} />
              {/* Body */}
              <View style={[styles.avatarBody, p.isHighlighted && styles.avatarPartHighlighted]} />
            </View>
            <Text style={[styles.playerLabel, p.isHighlighted && styles.playerLabelHighlighted]}>
              {p.id}
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCard: {
    width: Q_CARD_W,
    height: Q_CARD_H,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  questionCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMark: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  sweepBar: {
    position: 'absolute',
    left: -Q_CARD_W,
    top: 0,
    width: Q_CARD_W,
    height: Q_CARD_H,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  gap: {
    height: 16,
  },
  playerRow: {
    flexDirection: 'row',
    gap: ROW_GAP,
  },
  playerItem: {
    alignItems: 'center',
    width: PLAYER_CARD_W,
    gap: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCircleHighlighted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.raised,
  },
  avatarHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.muted,
    marginBottom: 1,
  },
  avatarBody: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: Colors.muted,
  },
  avatarPartHighlighted: {
    backgroundColor: Colors.primary,
  },
  playerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  playerLabelHighlighted: {
    color: Colors.primary,
  },
});
