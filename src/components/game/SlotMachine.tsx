import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Radius, Mono } from '../../theme';
import { getQuestions, findQuestion } from '../../data/packs';
import type { PackId } from '../../store/types';

interface Props {
  /** The correct question ID to land on */
  questionId: number;
  /** The room's pack — questions are resolved against it */
  pack: PackId | null;
  /** Called when the reveal animation completes (question is visible) */
  onRevealed?: () => void;
}

// Reel geometry
const CELL_H = 92;
const WINDOW_H = 132;
const CENTER_OFFSET = (WINDOW_H - CELL_H) / 2; // top offset of the centered cell
const STRIP_LEN = 34;
const LAND_INDEX = 30; // where the correct number sits in the strip
const START_INDEX = 3;
const FINAL_Y = CENTER_OFFSET - LAND_INDEX * CELL_H;
const START_Y = CENTER_OFFSET - START_INDEX * CELL_H;

/**
 * 3-phase reveal:
 *   Phase 1: "Shhh" privacy overlay (~1.8s) → fade out
 *   Phase 2: A real number reel — one tall strip driven by a single translateY
 *            shared value on the UI thread, decelerating then springing to land
 *   Phase 3: Land (gold window flash) → the secret question fades in → after a
 *            2.5s read hold, onRevealed() fires (parent slides it to the top)
 */
export function SlotMachine({ questionId, pack, onRevealed }: Props) {
  const [phase, setPhase] = useState<'shhh' | 'spinning' | 'landed' | 'revealed'>('shhh');
  const [reducedMotion, setReducedMotion] = useState(false);

  const realQuestion = findQuestion(pack, questionId);
  const finalNumber = questionId;
  const bankIds = useMemo(() => getQuestions(pack).map((q) => q.id), [pack]);

  // The reel strip: random pack numbers, with the real one at the landing index.
  const strip = useMemo(() => {
    const rnd = () =>
      bankIds.length > 0
        ? bankIds[Math.floor(Math.random() * bankIds.length)]
        : Math.floor(Math.random() * 186) + 1;
    return Array.from({ length: STRIP_LEN }, (_, i) => (i === LAND_INDEX ? finalNumber : rnd()));
  }, [finalNumber, bankIds]);

  const shhhOpacity = useSharedValue(0);
  const reelY = useSharedValue(START_Y);
  const flashOpacity = useSharedValue(0);
  const questionOpacity = useSharedValue(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const track = (t: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(t);
    return t;
  };

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Reduce motion → skip straight to the revealed state.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (!enabled) return;
        setReducedMotion(true);
        reelY.value = FINAL_Y;
        shhhOpacity.value = 0;
        questionOpacity.value = 1;
        setPhase('revealed');
        track(setTimeout(() => onRevealed?.(), 120));
      })
      .catch(() => {});
  }, []);

  const onLanded = () => {
    setPhase('landed');
    // Gold window flash.
    flashOpacity.value = withSequence(
      withTiming(0.28, { duration: 140 }),
      withTiming(0, { duration: 360 })
    );
    // Hold, then reveal the question text.
    track(
      setTimeout(() => {
        questionOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
        setPhase('revealed');
        track(setTimeout(() => onRevealed?.(), 2500));
      }, 560)
    );
  };

  const startReel = () => {
    reelY.value = START_Y;
    reelY.value = withSequence(
      // Decelerate through the numbers…
      withTiming(FINAL_Y - 18, { duration: 2100, easing: Easing.bezier(0.11, 0.68, 0.16, 1) }),
      // …overshoot slightly, then spring back to land with a bounce.
      withSpring(FINAL_Y, { damping: 12, stiffness: 150, mass: 0.9 }, (finished) => {
        if (finished) runOnJS(onLanded)();
      })
    );
  };

  // Phase 1 → 2: shhh overlay, then start the reel.
  useEffect(() => {
    if (reducedMotion) return;
    shhhOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    track(
      setTimeout(() => {
        shhhOpacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
        track(
          setTimeout(() => {
            setPhase('spinning');
            startReel();
          }, 420)
        );
      }, 1800)
    );
  }, [reducedMotion]);

  const reelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: reelY.value }] }));
  const shhhStyle = useAnimatedStyle(() => ({ opacity: shhhOpacity.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const questionStyle = useAnimatedStyle(() => ({ opacity: questionOpacity.value }));

  const landed = phase === 'landed' || phase === 'revealed';

  return (
    <View style={styles.root}>
      <View style={styles.spinnerContainer}>
        <Text style={styles.pickingText}>Picking your question…</Text>

        {/* Number reel */}
        <View style={styles.reelWindow}>
          <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
          <Animated.View style={[styles.strip, reelStyle]}>
            {strip.map((n, i) => (
              <View key={i} style={styles.cell}>
                <Text style={[styles.number, i === LAND_INDEX && landed && styles.numberLanded]}>{n}</Text>
              </View>
            ))}
          </Animated.View>
          <LinearGradient colors={[Colors.bg, 'transparent']} style={styles.fadeTop} pointerEvents="none" />
          <LinearGradient colors={['transparent', Colors.bg]} style={styles.fadeBottom} pointerEvents="none" />
          <View style={styles.bracket} pointerEvents="none" />
        </View>

        {/* Secret question — fades in after landing */}
        <Animated.View style={[styles.questionWrapper, questionStyle]}>
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>YOUR SECRET QUESTION</Text>
            <Text style={styles.questionText}>{realQuestion?.text ?? ''}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Shhh privacy overlay */}
      {phase === 'shhh' && (
        <Animated.View style={[styles.shhhOverlay, shhhStyle]}>
          <Text style={styles.shhhEmoji}>🤫</Text>
          <Text style={styles.shhhText}>Shhh... don't show anyone</Text>
        </Animated.View>
      )}
    </View>
  );
}

const BRACKET_INSET = 24;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },

  // Shhh overlay — navy privacy screen
  shhhOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 16,
    borderRadius: Radius.xl,
  },
  shhhEmoji: { fontSize: 56, textAlign: 'center' },
  shhhText: { fontSize: 20, fontWeight: '700', color: Colors.onNavy, textAlign: 'center' },

  // Spinner
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  pickingText: {
    ...Typography.body,
    color: Colors.inkSoft,
    textAlign: 'center',
  },

  // Reel
  reelWindow: {
    width: '100%',
    height: WINDOW_H,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cell: {
    height: CELL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: Mono,
    fontSize: 66,
    fontWeight: '800',
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  numberLanded: {
    color: Colors.navy,
  },
  bracket: {
    position: 'absolute',
    top: CENTER_OFFSET,
    left: BRACKET_INSET,
    right: BRACKET_INSET,
    height: CELL_H,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  flash: {
    position: 'absolute',
    top: CENTER_OFFSET,
    left: BRACKET_INSET,
    right: BRACKET_INSET,
    height: CELL_H,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 34,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 34,
  },

  // Secret-question hero card — navy "classified" surface with gold label
  questionWrapper: {
    width: '100%',
    paddingHorizontal: 0,
  },
  questionCard: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.sm,
    borderBottomWidth: 5,
    borderBottomColor: Colors.navyEdge,
  },
  questionLabel: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  questionText: {
    ...Typography.display,
    color: Colors.onNavy,
  },
});
