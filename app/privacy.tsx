import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '../src/components/ui/BackButton'
import { Colors, Spacing, Typography, Layout } from '../src/theme'

/**
 * Privacy page — a concise statement of the temporary data the game collects,
 * why, and when it is deleted, plus a short overview of the app.
 */
export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy</Text>

        <Text style={styles.body}>
          The ID Game is an in-person party game; your phone is only a companion for a
          single session. We collect the minimum needed to run that session and delete
          it automatically.
        </Text>

        <Text style={styles.h}>About this app</Text>
        <Text style={styles.body}>
          The app is an in-person social guessing game. It contains several optional
          question packs. The mature pack is text-only, is not selected by default,
          requires each participant to confirm they are 18+, includes a clear content
          warning, and allows questions to be skipped.
        </Text>

        <Text style={styles.h}>What we collect</Text>
        <View style={styles.list}>
          <Bullet>An anonymous user ID — no login, email, or real name.</Bullet>
          <Bullet>The nickname you enter.</Bullet>
          <Bullet>Your room membership and host status.</Bullet>
          <Bullet>The room's selected question pack.</Bullet>
          <Bullet>For the 18+ pack: your age confirmation, its timestamp, and the warning version.</Bullet>
          <Bullet>Round state, guesses, and temporary scores for the current game.</Bullet>
        </View>

        <Text style={styles.h}>What we don't collect</Text>
        <View style={styles.list}>
          <Bullet>No legal names, emails, phone numbers, or dates of birth.</Bullet>
          <Bullet>No identity documents — physical ID cards stay on the table and are never photographed or uploaded.</Bullet>
          <Bullet>No precise location, permanent history, or advertising profiles.</Bullet>
        </View>

        <Text style={styles.h}>Question content</Text>
        <Text style={styles.body}>
          Question and answer text lives only in the app. We never send it to our
          servers — only anonymous ID numbers, which your device resolves locally.
        </Text>

        <Text style={styles.h}>Data retention</Text>
        <Text style={styles.body}>
          When a game ends or a room becomes inactive, the room and all associated data
          — players, rounds, guesses, scores, and age confirmations — are deleted within
          24 hours. Local data on your device is cleared the next time you open the app.
        </Text>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.dot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Layout.screenPaddingTop + 8,
    paddingBottom: Layout.screenPaddingBottom,
    gap: Spacing.sm,
  },
  title: { ...Typography.display, marginBottom: Spacing.sm },
  h: {
    ...Typography.heading,
    color: Colors.ink,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  body: { ...Typography.body, color: Colors.ink },
  list: { gap: Spacing.sm, marginTop: Spacing.xs },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  bulletText: { ...Typography.body, color: Colors.ink, flex: 1 },
})
