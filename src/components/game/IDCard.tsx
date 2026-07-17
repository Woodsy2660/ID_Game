import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '../../theme';

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
    width: 118,
    height: 74,
  },
  shadowLayer: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.navyEdge,
    borderRadius: Radius.lg,
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(19,35,96,0.12)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  leftSection: {
    width: 34,
    justifyContent: 'center',
  },
  photoBox: {
    width: 34,
    height: 40,
    backgroundColor: 'rgba(19,35,96,0.16)',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  photoBody: {
    width: 19,
    height: 14,
    backgroundColor: 'rgba(19,35,96,0.4)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  photoHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(19,35,96,0.4)',
    position: 'absolute',
    top: 8,
  },
  rightSection: {
    flex: 1,
    paddingTop: 4,
  },
  textLine: {
    height: 3,
    backgroundColor: Colors.navyEdge,
    borderRadius: 2,
    opacity: 0.22,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 'auto',
    marginBottom: 2,
  },
  tag: {
    width: 26,
    height: 8,
    backgroundColor: Colors.navyEdge,
    borderRadius: 4,
    opacity: 0.22,
  },
});
