import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '../../theme';

interface Props {
  visible: boolean;
  loading: boolean;
  onKeepPlaying: () => void;
  onEndGame: () => void;
}

export function EndGameModal({ visible, loading, onKeepPlaying, onEndGame }: Props) {
  const overlayOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.96);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      modalScale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      modalOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else {
      overlayOpacity.value = 0;
      modalScale.value = 0.96;
      modalOpacity.value = 0;
    }
  }, [visible]);

  // Escape key handler (web)
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKeepPlaying();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onKeepPlaying]);

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalAnimStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onKeepPlaying}
    >
      <View style={styles.root}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayAnimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onKeepPlaying} />
        </Animated.View>

        {/* Modal card */}
        <Animated.View style={[styles.card, modalAnimStyle]}>
          {/* Close X button */}
          <TouchableOpacity onPress={onKeepPlaying} style={styles.closeButton} hitSlop={12}>
            <Text style={styles.closeIcon}>{'\u2715'}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>End game?</Text>
          <Text style={styles.body}>This will end the current game for everyone.</Text>

          <View style={styles.actions}>
            {/* Primary safe action */}
            <Pressable
              onPress={onKeepPlaying}
              style={({ pressed }) => [
                styles.keepPlayingButton,
                pressed && styles.keepPlayingPressed,
              ]}
            >
              <Text style={styles.keepPlayingText}>KEEP PLAYING</Text>
            </Pressable>

            {/* Secondary destructive action */}
            <Pressable
              onPress={onEndGame}
              disabled={loading}
              style={({ pressed }) => [
                styles.endGameButton,
                pressed && !loading && styles.endGamePressed,
                loading && styles.endGameDisabled,
              ]}
            >
              <Text style={[styles.endGameText, loading && styles.endGameTextDisabled]}>
                {loading ? 'ENDING...' : 'END GAME'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '88%',
    maxWidth: 360,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: Spacing.lg,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.lg,
  },
  actions: {
    gap: Spacing.sm,
  },

  // Primary — keep playing (safe)
  keepPlayingButton: {
    width: '100%',
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepPlayingPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  keepPlayingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    textTransform: 'uppercase',
    letterSpacing: 0.98,
  },

  // Secondary destructive — end game
  endGameButton: {
    width: '100%',
    height: 44,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endGamePressed: {
    opacity: 0.8,
    transform: [{ translateY: 1 }],
  },
  endGameDisabled: {
    opacity: 0.4,
  },
  endGameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  endGameTextDisabled: {
    color: Colors.error,
  },
});
