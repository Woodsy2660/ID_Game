import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Spacing, Radius } from '../../theme';

interface Props {
  delay?: number;
}

/**
 * A stylized ID Card component for the ranking phase.
 * Shows a simple yellow card with a signature blue shadow.
 */
export function IDCard({ delay = 0 }: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.outerContainer}>
      <View style={styles.cardWrapper}>
        {/* The Blue Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* The Main Yellow Card */}
        <View style={styles.card}>
          <View style={styles.content}>
            <View style={styles.leftSection}>
              {/* The Photo Placeholder */}
              <View style={styles.photoBox}>
                <View style={styles.photoBody} />
                <View style={styles.photoHead} />
              </View>
            </View>

            <View style={styles.rightSection}>
              {/* Abstract Text Lines */}
              <View style={[styles.textLine, { width: '80%', height: 10, marginBottom: 6, opacity: 0.3 }]} />
              <View style={[styles.textLine, { width: '100%', marginBottom: 8 }]} />
              <View style={[styles.textLine, { width: '90%', marginBottom: 6 }]} />
              <View style={[styles.textLine, { width: '95%' }]} />

              <View style={styles.tagContainer}>
                <View style={styles.tag} />
                <View style={styles.tag} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: 158,
    height: 100,
  },
  shadowLayer: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1E2B6D',
    borderRadius: Radius.lg,
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD738',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  leftSection: {
    width: 44,
    justifyContent: 'center',
  },
  photoBox: {
    width: 44,
    height: 50,
    backgroundColor: '#2D323E',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  photoBody: {
    width: 24,
    height: 18,
    backgroundColor: '#3F4451',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  photoHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3F4451',
    position: 'absolute',
    top: 10,
  },
  rightSection: {
    flex: 1,
    paddingTop: 4,
  },
  textLine: {
    height: 3,
    backgroundColor: '#BA9600',
    borderRadius: 2,
    opacity: 0.2,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 'auto',
    marginBottom: 2,
  },
  tag: {
    width: 34,
    height: 10,
    backgroundColor: '#BA9600',
    borderRadius: 5,
    opacity: 0.2,
  },
});
