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
const BOTTOM_BAR_HEIGHT = 120;

const SLIDE_DATA = [
  {
    title: 'Place your IDs on the table',
    body: 'This is a physical game. Each player places their real ID card in the centre of the group.',
  },
  {
    title: 'One player sees a secret question',
    body: 'No one else knows what it is.',
  },
  {
    title: 'Rank the group',
    body: 'The Question Master orders players from most to least likely using the IDs.',
  },
  {
    title: 'Other players guess the right question',
    body: 'Score a point if you get it right, no points for getting it wrong.',
  },
  {
    title: 'Have fun playing!',
    body: 'Let\u2019s see who knows who best \uD83D\uDE43',
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
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
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
                    centerText={'centerText' in slide && !!slide.centerText}
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
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
