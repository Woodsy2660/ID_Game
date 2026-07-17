import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Spacing, Typography } from '../../theme';
import { ScrollFadeOverlay } from '../ui/ScrollFadeOverlay';
import { useScrollFades } from '../../hooks/useScrollFades';
import { getQuestions, isMaturePack, PACK_META } from '../../data/packs';
import { usePlayerStore } from '../../store/playerStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const DISMISS_THRESHOLD = 120;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SHEET_BG = '#FFFFFF';

export function QuestionsPreviewModal({ visible, onClose }: Props) {
  const { showTopFade, showBottomFade, scrollHandler, onContentSizeChange, onLayout: fadeLayout } =
    useScrollFades();

  const pack = usePlayerStore((s) => s.pack);
  const adultConfirmed = usePlayerStore((s) => s.adult_confirmed);
  // Preview only ever shows the selected pack. Mature questions stay hidden
  // until this player has completed the 18+ confirmation.
  const locked = isMaturePack(pack) && !adultConfirmed;
  const questions = locked ? [] : getQuestions(pack);
  const packName = pack ? PACK_META[pack].name : 'Questions';

  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);

  const close = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 250 });
    sheetTranslateY.value = withTiming(SHEET_HEIGHT, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, overlayOpacity, sheetTranslateY]);

  useEffect(() => {
    if (visible) {
      // Reset, then animate the sheet up and the scrim in.
      sheetTranslateY.value = SHEET_HEIGHT;
      overlayOpacity.value = 0;
      sheetTranslateY.value = withTiming(0, { duration: 300 });
      overlayOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [visible, sheetTranslateY, overlayOpacity]);

  // Drag the handle down to dismiss. Attached to the handle only, so the
  // question list scrolls independently (no scroll-vs-drag conflict).
  const dragHandle = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      if (e.translationY > 0) {
        sheetTranslateY.value = e.translationY;
        overlayOpacity.value = 1 - e.translationY / SHEET_HEIGHT;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 500) {
        overlayOpacity.value = withTiming(0, { duration: 250 });
        sheetTranslateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        sheetTranslateY.value = withTiming(0, { duration: 200 });
        overlayOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetTranslateY.value }] }));

  const renderItem = useCallback(
    ({ item, index }: { item: { id: number; text: string }; index: number }) => (
      <View style={styles.row}>
        <Text style={styles.rowNumber}>
          {String(index + 1).padStart(2, '0')}
        </Text>
        <Text style={styles.rowText}>{item.text}</Text>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: { id: number; text: string }) => String(item.id),
    []
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Drag handle — drag down to dismiss */}
          <GestureDetector gesture={dragHandle}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{packName}</Text>
              <Text style={styles.headerSubtitle}>
                {locked ? 'Confirm 18+ to preview' : `${questions.length} questions`}
              </Text>
            </View>
            <Pressable
              onPress={close}
              style={styles.closeButton}
              hitSlop={12}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Question list */}
          <View style={styles.listWrapper}>
            {locked ? (
              <View style={styles.lockedArea}>
                <Text style={styles.lockedText}>
                  This pack contains 18+ content. Confirm you are 18 or older to preview the questions.
                </Text>
              </View>
            ) : questions.length === 0 ? (
              <View style={styles.lockedArea}>
                <Text style={styles.lockedText}>
                  Questions for this room will appear here once the pack loads.
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={questions}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={20}
                  maxToRenderPerBatch={30}
                  onScroll={scrollHandler}
                  scrollEventThrottle={16}
                  onContentSizeChange={onContentSizeChange}
                  onLayout={fadeLayout}
                />
                <ScrollFadeOverlay showTop={showTopFade} showBottom={showBottomFade} bg={SHEET_BG} />
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    ...Typography.display,
    fontSize: 22,
    lineHeight: 28,
  },
  headerSubtitle: {
    ...Typography.helper,
  },
  lockedArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  lockedText: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.inkSoft,
    fontWeight: '600',
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowNumber: {
    width: 32,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryEdge,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  rowText: {
    ...Typography.body,
    flex: 1,
  },
});
