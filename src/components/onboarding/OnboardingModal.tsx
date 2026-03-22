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
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { OnboardingVisualGuessing } from './visuals/OnboardingVisualGuessing';
import { OnboardingVisualScoring } from './visuals/OnboardingVisualScoring';
import type { OnboardingControls } from '../../hooks/useOnboarding';

const SKIP_ROW_HEIGHT = 48;
const BOTTOM_BAR_HEIGHT = 120;

const SLIDE_DATA = [
  {
    title: 'Place your IDs on the table',
    body: 'This is a physical game. Each player places their real ID card in the centre of the group.',
  },
  {
    title: 'One player sees a secret question',
    body: 'One player sees a secret question. No one else knows what it is.',
  },
  {
    title: 'Rank the group',
    body: 'The Question Master orders players from most to least likely using the IDs.',
  },
  {
    title: 'Guess the question',
    body: 'Everyone else picks what they think the secret question was.',
  },
  {
    title: 'Score a point',
    body: 'Get the exact question right to earn a point.',
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

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (newIndex !== intentStepRef.current) {
      goTo(newIndex);
    }
  };

  const renderVisual = (index: number) => {
    const props = { isActive: index === step, reduceMotion };
    switch (index) {
      case 0: return <OnboardingVisualSetup {...props} />;
      case 1: return <OnboardingVisualSecretQuestion {...props} />;
      case 2: return <OnboardingVisualRanking {...props} />;
      case 3: return <OnboardingVisualGuessing {...props} />;
      case 4: return <OnboardingVisualScoring {...props} />;
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
          {/* Skip row */}
          <View style={[styles.skipRow, { height: SKIP_ROW_HEIGHT }]}>
            <TouchableOpacity onPress={close} style={styles.skipButton} hitSlop={12}>
              <Text style={styles.skipText}>Skip</Text>
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
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}
              >
                {SLIDE_DATA.map((slide, i) => (
                  <OnboardingSlide
                    key={i}
                    title={slide.title}
                    body={slide.body}
                    visual={renderVisual(i)}
                    width={screenWidth}
                    height={slideAreaHeight}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, { height: BOTTOM_BAR_HEIGHT }]}>
            <ProgressDots total={totalSteps} current={step} />
            <Button
              title={step === totalSteps - 1 ? 'Start Game' : 'Next'}
              onPress={step === totalSteps - 1 ? complete : next}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safe: {
    flex: 1,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  slideArea: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
    justifyContent: 'flex-end',
  },
});
