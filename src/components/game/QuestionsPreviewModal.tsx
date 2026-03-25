import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import questionBank from '../../data/questionBank.json';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const DISMISS_THRESHOLD = 120;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function QuestionsPreviewModal({ visible, onClose }: Props) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const open = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, sheetTranslateY]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [overlayOpacity, sheetTranslateY, onClose]);

  useEffect(() => {
    if (visible) {
      // Reset position before animating in
      sheetTranslateY.setValue(SHEET_HEIGHT);
      overlayOpacity.setValue(0);
      open();
    }
  }, [visible, open, sheetTranslateY, overlayOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture vertical downward drags
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
          overlayOpacity.setValue(1 - gestureState.dy / SHEET_HEIGHT);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          close();
        } else {
          Animated.parallel([
            Animated.timing(sheetTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

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
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag handle */}
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Classic Game Mode</Text>
              <Text style={styles.headerSubtitle}>
                {questionBank.length} questions
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
          <FlatList
            data={questionBank}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={30}
          />
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
    backgroundColor: '#1C1C1E',
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
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.muted,
    opacity: 0.5,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
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
    fontWeight: '500',
    color: Colors.muted,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  rowText: {
    ...Typography.body,
    flex: 1,
  },
});
