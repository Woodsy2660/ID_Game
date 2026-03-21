import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Button } from '../../src/components/ui/Button';
import { ResultSplash } from '../../src/components/game/ResultSplash';
import { useGameStore } from '../../src/store/gameStore';
import { Spacing } from '../../src/theme';

/**
 * Round Results screen — shows the correct answer and each player's result.
 *
 * State machine: round_results → leaderboard
 */
export default function RoundResultsScreen() {
  const router = useRouter();
  const qmPlayerId = useGameStore((s) => s.qmPlayerId);
  const players = useGameStore((s) => s.players);
  const roundResults = useGameStore((s) => s.roundResults);
  const advancePhase = useGameStore((s) => s.advancePhase);

  const qmPlayer = players.find((p) => p.id === qmPlayerId);
  const latestResult = roundResults[roundResults.length - 1];

  const handleContinue = () => {
    advancePhase(); // → leaderboard
    router.replace('/(game)/leaderboard');
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {latestResult && (
          <ResultSplash
            questionId={latestResult.questionId}
            qmName={qmPlayer?.displayName ?? '???'}
            answers={latestResult.answers}
            players={players}
          />
        )}
      </ScrollView>
      <View style={styles.buttonArea}>
        <Button title="See Leaderboard" onPress={handleContinue} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  buttonArea: {
    paddingTop: Spacing.lg,
  },
});
