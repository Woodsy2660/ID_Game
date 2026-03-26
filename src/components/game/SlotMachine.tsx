import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import questionBank from '../../data/questionBank.json';

interface Props {
  /** The correct question ID to land on */
  questionId: number;
  /** The 10 visible answer option IDs (what answerers will choose from) */
  visibleQuestionIds: number[];
  /** Called when the reveal animation completes (question is visible) */
  onRevealed?: () => void;
  /** When true, collapses spinner and pins question card to top */
  compact?: boolean;
}

const TOTAL_QUESTIONS = questionBank.length; // 186

/**
 * 4-phase animated spinner:
 *   Phase 1: "Shhh" overlay (2s) → fade out (400ms)
 *   Phase 2: Number spinner — rapid cycling, decelerating over ~2.5s
 *   Phase 3: Land on number, hold 600ms, fade in question text
 *   Phase 4: After 2.5s hold, calls onRevealed (parent handles slide-to-top)
 */
export function SlotMachine({ questionId, visibleQuestionIds, onRevealed, compact = false }: Props) {
  const [phase, setPhase] = useState<'shhh' | 'spinning' | 'landed' | 'revealed'>('shhh');
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const realQuestion = questionBank.find((q) => q.id === questionId);
  const correctIndex = visibleQuestionIds.indexOf(questionId);
  const finalNumber = correctIndex + 1;

  // Animation values
  const shhhOpacity = useSharedValue(0);
  const spinnerOpacity = useSharedValue(0);
  const numberScale = useSharedValue(1);
  const questionOpacity = useSharedValue(0);
  const bracketOpacity = useSharedValue(0.3);
  const numberOpacityVal = useSharedValue(1);
  const compactProgress = useSharedValue(0); // 0 = full spinner, 1 = compact (question pinned top)

  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate to compact mode — single smooth transition
  useEffect(() => {
    if (compact) {
      compactProgress.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) });
      numberOpacityVal.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
      bracketOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [compact]);

  // Check reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (enabled) {
        setReducedMotion(true);
        // Skip all animation — go straight to revealed
        setDisplayNumber(finalNumber);
        shhhOpacity.value = 0;
        spinnerOpacity.value = 1;
        questionOpacity.value = 1;
        bracketOpacity.value = 0;
        setPhase('revealed');
        setTimeout(() => onRevealed?.(), 100);
      }
    }).catch(() => {});
  }, []);

  // Phase 1 → Phase 2 transition
  useEffect(() => {
    if (reducedMotion) return;

    // Fade shhh overlay in
    shhhOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });

    // After 2s (including fade-in), fade out shhh overlay
    const shhhTimer = setTimeout(() => {
      shhhOpacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      // After fade completes, start spinner
      setTimeout(() => {
        setPhase('spinning');
        spinnerOpacity.value = withTiming(1, { duration: 200 });
        startSpinner();
      }, 420);
    }, 2000);

    return () => {
      clearTimeout(shhhTimer);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, [questionId, reducedMotion]);

  const startSpinner = useCallback(() => {
    let step = 0;
    const totalSteps = 28;

    const tick = () => {
      if (step < totalSteps) {
        // Random question numbers from the full pool (1–186)
        const randomNum = Math.floor(Math.random() * TOTAL_QUESTIONS) + 1;
        setDisplayNumber(randomNum);
        step++;

        // Exponential deceleration: 50ms → ~500ms
        const delay = 50 + Math.pow(step / totalSteps, 3.2) * 480;
        spinTimerRef.current = setTimeout(tick, delay);
      } else {
        // Land on the correct number
        setDisplayNumber(finalNumber);
        setPhase('landed');

        // Bounce scale on landing
        numberScale.value = withSequence(
          withTiming(1.2, { duration: 150, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.cubic) })
        );

        // Highlight bracket flash
        bracketOpacity.value = withSequence(
          withTiming(0.6, { duration: 150 }),
          withTiming(0.15, { duration: 300 })
        );

        // After 600ms hold, reveal question text
        setTimeout(() => {
          questionOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
          setPhase('revealed');

          // Hold question visible for 2.5s so QM can read, then signal parent
          setTimeout(() => {
            onRevealed?.();
          }, 2500);
        }, 600);
      }
    };

    tick();
  }, [finalNumber, onRevealed]);

  // Animated styles
  const shhhAnimStyle = useAnimatedStyle(() => ({
    opacity: shhhOpacity.value,
  }));

  const spinnerAnimStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
  }));

  const numberAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
    opacity: numberOpacityVal.value,
  }));

  // Number area collapses smoothly: height shrinks, gap closes
  const numberAreaAnimStyle = useAnimatedStyle(() => ({
    maxHeight: (1 - compactProgress.value) * 220,
    marginBottom: (1 - compactProgress.value) * 32,
    opacity: 1 - compactProgress.value,
    overflow: 'hidden' as const,
  }));

  // No translateY needed — parent layout switches from center to flex-start

  const bracketAnimStyle = useAnimatedStyle(() => ({
    opacity: bracketOpacity.value,
  }));

  const questionAnimStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
  }));

  return (
    <View style={[styles.root, compact && styles.rootCompact]}>
      {/* Spinner content (behind overlay initially) */}
      <Animated.View style={[compact ? styles.spinnerCompact : styles.spinnerContainer, spinnerAnimStyle]}>
        {/* Number with bracket frame — collapses in compact mode */}
        <Animated.View style={numberAreaAnimStyle}>
          <Text style={styles.pickingText}>Picking your question…</Text>
          <View style={styles.numberArea}>
            <Animated.View style={[styles.bracket, bracketAnimStyle]} />
            <Animated.View style={numberAnimStyle}>
              <Text
                style={[
                  styles.number,
                  (phase === 'landed' || phase === 'revealed') && styles.numberLanded,
                ]}
              >
                {displayNumber ?? '?'}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Question card — fades in after landing, stays in compact mode */}
        <Animated.View style={[styles.questionWrapper, questionAnimStyle]}>
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>YOUR SECRET QUESTION</Text>
            <Text style={styles.questionText}>{realQuestion?.text ?? ''}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Shhh overlay — sits on top */}
      {phase === 'shhh' && (
        <Animated.View style={[styles.shhhOverlay, shhhAnimStyle]} pointerEvents={phase === 'shhh' ? 'auto' : 'none'}>
          <Text style={styles.shhhEmoji}>🤫</Text>
          <Text style={styles.shhhText}>Shhh... don't show anyone</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  rootCompact: {
    flex: 0,
  },

  // Shhh overlay
  shhhOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,18,18,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 16,
  },
  shhhEmoji: {
    fontSize: 56,
    textAlign: 'center',
  },
  shhhText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },

  // Spinner
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  spinnerCompact: {
    alignItems: 'center',
    gap: 0,
  },
  pickingText: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  numberArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  bracket: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  number: {
    fontSize: 72,
    fontWeight: '800',
    color: Colors.muted,
    textAlign: 'center',
    minWidth: 100,
  },
  numberLanded: {
    color: Colors.primary,
  },

  // Question card (matches SecretQuestionCard style)
  questionWrapper: {
    width: '100%',
    paddingHorizontal: 4,
  },
  questionCard: {
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    gap: Spacing.sm,
  },
  questionLabel: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  questionText: {
    ...Typography.display,
    color: Colors.white,
  },
});
