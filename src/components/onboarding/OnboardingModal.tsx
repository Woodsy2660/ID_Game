import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../theme';
import { Button } from '../ui/Button';
import { ProgressDots } from './ProgressDots';
import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingVisualSetup } from './visuals/OnboardingVisualSetup';
import { OnboardingVisualSecretQuestion } from './visuals/OnboardingVisualSecretQuestion';
import { OnboardingVisualRanking } from './visuals/OnboardingVisualRanking';
import { OnboardingVisualGuessAndScore } from './visuals/OnboardingVisualGuessAndScore';
import { OnboardingVisualHaveFun } from './visuals/OnboardingVisualHaveFun';
import type { OnboardingControls } from '../../hooks/useOnboarding';

const SKIP_ROW_HEIGHT = 48;
const BOTTOM_BAR_HEIGHT = 140;

const SLIDE_DATA = [
  {
    title: 'Put your IDs on the table',
    body: 'The ID Game is played in person. Everyone drops a real ID card into the middle of the group \u2014 your phone is just the companion.',
  },
  {
    title: 'One player gets a secret question',
    body: 'Each round, one player becomes the Question Master and secretly sees a \u201CMost likely to\u2026\u201D question that no one else can read.',
  },
  {
    title: 'They rank everyone\u2019s IDs',
    body: 'Without saying the question out loud, the Question Master lines up the IDs from most to least likely.',
  },
  {
    title: 'Everyone else guesses the question',
    body: 'Study the ranking, then pick which question you think it was from the options on your phone. Guess right to score a point.',
  },
  {
    title: 'Then it\u2019s someone else\u2019s turn',
    body: 'The Question Master role passes around the group each round. Whoever reads the room best wins. \uD83E\uDEAA',
    centerText: true,
  },
];

interface Props extends OnboardingControls {}

export function OnboardingModal({ isOpen, step, totalSteps, close, next, complete, goTo }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const intentStepRef = useRef(step);
  const isFirstOpenRef = useRef(true);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [slideAreaHeight, setSlideAreaHeight] = useState(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // Escape key handler (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  // Sync scroll position with step
  useEffect(() => {
    if (!isOpen) {
      isFirstOpenRef.current = true;
      return;
    }
    intentStepRef.current = step;
    const animated = !reduceMotion && !isFirstOpenRef.current;
    isFirstOpenRef.current = false;
    scrollRef.current?.scrollTo({ x: step * screenWidth, animated });
  }, [step, isOpen, reduceMotion, screenWidth]);

  const renderVisual = (index: number) => {
    const props = { isActive: index === step, reduceMotion };
    switch (index) {
      case 0: return <OnboardingVisualSetup {...props} />;
      case 1: return <OnboardingVisualSecretQuestion {...props} />;
      case 2: return <OnboardingVisualRanking {...props} />;
      case 3: return <OnboardingVisualGuessAndScore {...props} />;
      case 4: return <OnboardingVisualHaveFun {...props} />;
      default: return null;
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      statusBarTranslucent
      transparent={false}
    >
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          {/* Close row */}
          <View style={[styles.skipRow, { height: SKIP_ROW_HEIGHT }]}>
            <TouchableOpacity onPress={close} style={styles.closeButton} hitSlop={12}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Slide area */}
          <View
            style={styles.slideArea}
            onLayout={(e) => setSlideAreaHeight(e.nativeEvent.layout.height)}
          >
            {slideAreaHeight > 0 && (
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                bounces={false}
                scrollEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  if (idx !== step) goTo(idx);
                }}
              >
                {SLIDE_DATA.map((slide, i) => (
                  <OnboardingSlide
                    key={i}
                    title={slide.title}
                    body={slide.body}
                    visual={renderVisual(i)}
                    width={screenWidth}
                    height={slideAreaHeight}
                    centerText={'centerText' in slide && !!slide.centerText}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, { height: BOTTOM_BAR_HEIGHT }]}>
            <ProgressDots total={totalSteps} current={step} />
            <View style={styles.navRow}>
              <TouchableOpacity
                onPress={() => goTo(step - 1)}
                disabled={step === 0}
                style={[styles.backButton, step === 0 && styles.backHidden]}
                hitSlop={8}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <View style={styles.nextWrap}>
                <Button
                  title={step === totalSteps - 1 ? 'Start Game' : 'Next'}
                  onPress={step === totalSteps - 1 ? complete : next}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safe: {
    flex: 1,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.inkSoft,
    fontWeight: '700',
  },
  slideArea: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'flex-end',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHidden: {
    opacity: 0,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkSoft,
  },
  nextWrap: {
    flex: 1,
  },
});
