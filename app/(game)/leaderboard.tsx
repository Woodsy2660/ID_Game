import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LeaderboardIDCard } from '../../src/components/game/LeaderboardIDCard';
import { LeaderboardCompactRow } from '../../src/components/game/LeaderboardCompactRow';
import { useGameStore } from '../../src/store/gameStore';
import { useGameChannel } from '../../src/hooks/useGameChannel';
import { usePlayerStore } from '../../src/stores/playerStore';
import { supabase } from '../../src/lib/supabase';

/**
 * Leaderboard screen — shows cumulative scores after each round.
 *
 * Host taps "Next Round" → calls start-round edge function → broadcasts
 * round:started to all clients → everyone navigates to round-start.
 *
 * Non-hosts see "Waiting for host..." and navigate when the broadcast arrives.
 *
 * State machine: leaderboard → round_start (next round)
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
  const [showFade, setShowFade] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether content overflows the scroll container
  const scrollContentHeight = useRef(0);
  const scrollViewHeight = useRef(0);

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
        // Don't fall back here — broadcast may still arrive.
        // The 8s timeout will catch it if not.
      }
      // Success: navigation happens via onRoundStarted broadcast, which clears the timeout
    } catch (e) {
      console.warn('[leaderboard] start-round network error:', e);
      // Network error — broadcast definitely won't arrive, fall back immediately
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      nextRound();
      router.replace('/(game)/round-start');
      setLoading(false);
    }
  };

  // Sort players by score descending
  const ranked = [...players]
    .map((p) => ({ ...p, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const nextQM = getNextQMPlayer();

  const updateFadeVisibility = useCallback(() => {
    const contentH = scrollContentHeight.current;
    const viewH = scrollViewHeight.current;
    setShowFade(contentH > viewH + 10);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      setShowFade(distanceFromBottom > 10);
    },
    []
  );

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      scrollContentHeight.current = h;
      updateFadeVisibility();
    },
    [updateFadeVisibility]
  );

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      scrollViewHeight.current = e.nativeEvent.layout.height;
      updateFadeVisibility();
    },
    [updateFadeVisibility]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>After Round {currentRound + 1}</Text>
        </View>

        {/* Scrollable player list */}
        <View style={styles.listWrapper}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              ranked.length <= 3 && styles.scrollContentCentered,
              ranked.length >= 4 && ranked.length < 7 && styles.scrollContentCenteredSmall,
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayout}
          >
            {ranked.length < 7 ? (
              /* <7 players — stack all podium cards vertically as large cards, centered */
              <View style={styles.centeredPodium}>
                <View style={styles.podiumColumn}>
                  {top3.map((p, i) => (
                    <LeaderboardIDCard
                      key={p.id}
                      rank={(i + 1) as 1 | 2 | 3}
                      playerName={p.displayName}
                      score={p.score}
                      delay={i * 100}
                      size="large"
                    />
                  ))}
                  {/* Ranks 4–6 as compact rows, same width as large podium cards */}
                  {rest.map((p, i) => (
                    <View key={p.id} style={styles.compactRowAligned}>
                      <LeaderboardCompactRow
                        rank={i + 4}
                        playerName={p.displayName}
                        score={p.score}
                        delay={(i + 3) * 80}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              /* 7+ players — triple stack podium + compact rows */
              <>
                {/* Gold card centered on top */}
                <View style={styles.podiumColumn}>
                  <LeaderboardIDCard
                    rank={1}
                    playerName={top3[0].displayName}
                    score={top3[0].score}
                    delay={0}
                  />
                </View>

                {/* Silver + Bronze side by side */}
                <View style={styles.podiumRow}>
                  {top3.slice(1).map((p, i) => (
                    <LeaderboardIDCard
                      key={p.id}
                      rank={(i + 2) as 2 | 3}
                      playerName={p.displayName}
                      score={p.score}
                      delay={(i + 1) * 100}
                    />
                  ))}
                </View>

                {/* Gap between podium and list */}
                {rest.length > 0 && <View style={styles.sectionGap} />}

                {/* Ranks 4+ as compact rows */}
                {rest.map((p, i) => (
                  <LeaderboardCompactRow
                    key={p.id}
                    rank={i + 4}
                    playerName={p.displayName}
                    score={p.score}
                    delay={(i + 3) * 80}
                  />
                ))}
              </>
            )}
          </ScrollView>

          {/* Fade gradient at bottom of scroll */}
          {showFade && (
            <LinearGradient
              colors={['transparent', '#121212']}
              style={styles.fadeGradient}
              pointerEvents="none"
            />
          )}
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
              disabled={loading}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && !loading && styles.ctaPressed,
                loading && styles.ctaDisabled,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
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
    gap: 8,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollContentCenteredSmall: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  centeredPodium: {
    alignItems: 'center',
  },
  podiumColumn: {
    alignItems: 'center',
    gap: 12,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  compactRowAligned: {
    width: 210,
  },
  sectionGap: {
    height: 6,
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 12,
  },
  nextQMText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 52,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255,215,0,0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
    textTransform: 'uppercase',
    letterSpacing: 0.98,
  },
  waitingText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#555555',
    textAlign: 'center',
  },
});
