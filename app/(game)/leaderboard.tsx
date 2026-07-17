import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LeaderboardIDCard } from '../../src/components/game/LeaderboardIDCard';
import { LeaderboardCompactRow } from '../../src/components/game/LeaderboardCompactRow';
import { EndGameModal } from '../../src/components/game/EndGameModal';
import { LeaveGameButton } from '../../src/components/game/LeaveGameButton';
import { ScrollFadeOverlay } from '../../src/components/ui/ScrollFadeOverlay';
import { useScrollFades } from '../../src/hooks/useScrollFades';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { usePlayerStore } from '../../src/store/playerStore';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/theme';

/**
 * Leaderboard screen — shows cumulative scores after each round.
 *
 * Host taps "Next Round" → calls start-round edge function → broadcasts
 * round:started to all clients → everyone navigates to round-start.
 *
 * Host can also tap "End Game" → calls end-game → broadcasts game:ended → everyone exits.
 *
 * Non-hosts see "Waiting for host..." and navigate when the broadcast arrives.
 *
 * State machine: leaderboard → round_start (next round) | / (game ended)
 */
export default function LeaderboardScreen() {
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const scores = useGameStore((s) => s.scores);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const currentRound = useGameStore((s) => s.currentRound);
  const roomCode = useGameStore((s) => s.roomCode);
  const setNextRound = useGameStore((s) => s.setNextRound);
  const nextRound = useGameStore((s) => s.nextRound);
  const getNextQMPlayer = useGameStore((s) => s.getNextQMPlayer);

  const { room_id, is_host: playerStoreIsHost } = usePlayerStore();
  const isDevMode = roomCode?.startsWith('DEV');

  const isHost =
    isDevMode ||
    playerStoreIsHost ||
    (players.find((p) => p.id === localPlayerId)?.isHost ?? false);

  const [loading, setLoading] = useState(false);
  const [endingGame, setEndingGame] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    showTopFade,
    showBottomFade,
    scrollHandler,
    onContentSizeChange: fadeContentSizeChange,
    onLayout: fadeLayout,
  } = useScrollFades();

  useGameChannel(roomCode ?? '', {
    onRoundStarted: (payload) => {
      // Broadcast arrived — clear fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setNextRound(payload);
      router.replace('/(game)/round-start');
    },
    onGameEnded: () => {
      // Route to the closing ceremony instead of dumping straight home.
      // final-results reads the final scores from the game store and handles
      // channel/session cleanup when the player leaves it.
      usePlayerStore.getState().clearRoom();
      router.replace('/(game)/final-results');
    },
  });

  const handleNextRound = async () => {
    // Dev mode — advance locally
    if (isDevMode) {
      nextRound();
      router.replace('/(game)/round-start');
      return;
    }

    // No room_id — can't call edge function, fall back to local
    if (!room_id) {
      console.warn('[leaderboard] No room_id — falling back to local nextRound');
      nextRound();
      router.replace('/(game)/round-start');
      return;
    }

    setLoading(true);

    // Safety timeout — if broadcast never arrives after 8s, fall back locally
    fallbackTimerRef.current = setTimeout(() => {
      console.warn('[leaderboard] Broadcast timeout — falling back to local nextRound');
      fallbackTimerRef.current = null;
      nextRound();
      router.replace('/(game)/round-start');
      setLoading(false);
    }, 8000);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('start-round', {
        body: { room_id },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) {
        console.warn('[leaderboard] start-round error:', error);
      }
      // Success: navigation happens via onRoundStarted broadcast, which clears the timeout
    } catch (e) {
      console.warn('[leaderboard] start-round network error:', e);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      nextRound();
      router.replace('/(game)/round-start');
      setLoading(false);
    }
  };

  const doEndGame = async () => {
    setEndingGame(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('end-game', {
        body: { room_id },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
    } catch (e) {
      console.warn('[leaderboard] end-game error:', e);
    }
    setEndingGame(false);
    // Navigation handled by onGameEnded broadcast
  };

  const handleEndGame = () => setShowEndModal(true);

  const handleConfirmEndGame = () => {
    setShowEndModal(false);
    doEndGame();
  };

  // Sort players by score descending
  const ranked = [...players]
    .map((p) => ({ ...p, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const nextQM = getNextQMPlayer();

  return (
    <SafeAreaView style={styles.safe}>
      <LeaveGameButton note={isHost ? 'Leaving passes host to another player.' : undefined} />
      <View style={styles.container}>
        {/* Top-right "End game" action — host only */}
        {isHost && (
          <TouchableOpacity
            onPress={handleEndGame}
            style={styles.endGameAction}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={loading || endingGame}
          >
            <Text style={styles.endGameActionText}>End game</Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>After Round {currentRound + 1}</Text>
        </View>

        {/* Scrollable player list — one layout for any player count */}
        <View style={styles.listWrapper}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onContentSizeChange={fadeContentSizeChange}
            onLayout={fadeLayout}
          >
            {/* #1 — full-width hero card */}
            {top3[0] && (
              <LeaderboardIDCard
                rank={1}
                playerName={top3[0].displayName}
                score={top3[0].score}
                delay={0}
                size="large"
              />
            )}

            {/* #2 & #3 — side by side (a lone #2 fills the width) */}
            {top3.length > 1 && (
              <View style={styles.podiumRow}>
                {top3.slice(1).map((p, i) => (
                  <View key={p.id} style={styles.podiumCol}>
                    <LeaderboardIDCard
                      rank={(i + 2) as 2 | 3}
                      playerName={p.displayName}
                      score={p.score}
                      delay={(i + 1) * 100}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* #4+ — compact rows */}
            {rest.length > 0 && <View style={styles.sectionGap} />}
            {rest.map((p, i) => (
              <LeaderboardCompactRow
                key={p.id}
                rank={i + 4}
                playerName={p.displayName}
                score={p.score}
                delay={(i + 3) * 70}
              />
            ))}
          </ScrollView>

          <ScrollFadeOverlay showTop={showTopFade} showBottom={showBottomFade} />
        </View>

        {/* Footer — always show next QM + host CTA regardless of player count */}
        <View style={styles.footer}>
          {nextQM && (
            <Text style={styles.nextQMText}>
              Next QM: {nextQM.displayName}
            </Text>
          )}
          {isHost ? (
            <Pressable
              onPress={handleNextRound}
              disabled={loading || endingGame}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && !loading && !endingGame && styles.ctaPressed,
                (loading || endingGame) && styles.ctaDisabled,
              ]}
            >
              <Text style={styles.ctaText}>
                {loading ? 'STARTING...' : 'NEXT ROUND'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.waitingText}>
              Waiting for host to start next round...
            </Text>
          )}
        </View>
      </View>

      {/* End game confirmation modal */}
      <EndGameModal
        visible={showEndModal}
        loading={endingGame}
        onKeepPlaying={() => setShowEndModal(false)}
        onEndGame={handleConfirmEndGame}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  endGameAction: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
  },
  endGameActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkSoft,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 3,
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 10,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 10,
  },
  podiumCol: {
    flex: 1,
  },
  sectionGap: {
    height: 4,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 10,
  },
  nextQMText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: Colors.primaryEdge,
  },
  ctaPressed: {
    opacity: 0.94,
    transform: [{ translateY: 2 }],
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.98,
  },
  waitingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.inkSoft,
    textAlign: 'center',
  },
});
