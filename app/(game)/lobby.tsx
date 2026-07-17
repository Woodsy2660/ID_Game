import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { usePlayerStore } from '../../src/store/playerStore'
import { useGameStore } from '../../src/store/gameStore'
import { useRoom } from '../../src/hooks/useRoom'
import { ScreenContainer } from '../../src/components/ui/ScreenContainer'
import { Button } from '../../src/components/ui/Button'
import { Card } from '../../src/components/ui/Card'
import { Badge } from '../../src/components/ui/Badge'
import { Colors, Spacing, Typography, Layout } from '../../src/theme'
import { ScrollFadeOverlay } from '../../src/components/ui/ScrollFadeOverlay'
import { useScrollFades } from '../../src/hooks/useScrollFades'
import { LeaveGameButton } from '../../src/components/game/LeaveGameButton'
import { QuestionsPreviewButton } from '../../src/components/game/QuestionsPreviewButton'
import { QuestionsPreviewModal } from '../../src/components/game/QuestionsPreviewModal'
import { AdultConsentGate } from '../../src/components/game/AdultConsentGate'
import { useLeaveRoom } from '../../src/hooks/useLeaveRoom'
import { ADULT_WARNING_VERSION, isMaturePack } from '../../src/data/packs'
import type { GameStartPayload, PackId } from '../../src/store/types'

export default function LobbyScreen() {
  const router = useRouter()
  const { room_id, room_code, is_host, player_id, display_name, pack } = usePlayerStore()
  const clearRoom = usePlayerStore((s) => s.clearRoom)
  const setPack = usePlayerStore((s) => s.setPack)
  const setAdultConfirmed = usePlayerStore((s) => s.setAdultConfirmed)
  const adultConfirmed = usePlayerStore((s) => s.adult_confirmed)
  const leaveRoom = useLeaveRoom()
  const navigatedForward = useRef(false)

  useEffect(() => {
    return () => {
      if (!navigatedForward.current) {
        clearRoom()
      }
    }
  }, [])

  const handleGameStart = useCallback((payload: GameStartPayload) => {
    navigatedForward.current = true
    useGameStore.getState().initGame(
      payload.players,
      player_id ?? '',
      room_code ?? '',
      payload.pack,
      {
        qmPlayerId: payload.qmPlayerId,
        questionId: payload.questionId,
        visibleQuestionIds: payload.visibleQuestionIds,
        roundId: payload.roundId,
      }
    )
    // replace (not push) so the lobby unmounts for the game — otherwise it
    // lingers underneath, keeping a duplicate presence channel alive and
    // re-triggering its 18+ gate after the game ends.
    router.replace('/(game)/round-start')
  }, [router, player_id, room_code])

  const [previewVisible, setPreviewVisible] = useState(false)
  const { showTopFade, showBottomFade, scrollHandler, onContentSizeChange, onLayout } = useScrollFades()

  const { players, isConnected } = useRoom(
    room_code ?? '',
    player_id ?? '',
    display_name ?? '',
    is_host,
    handleGameStart,
    pack
  )

  // Joiners don't receive the room's pack from the (possibly un-redeployed)
  // join-room function, so learn it from the host's presence entry. This makes
  // the lobby preview and the 18+ gate work peer-to-peer, deploy-independent.
  const hostPack = (players.find((p) => p.is_host) as { pack?: PackId | null } | undefined)?.pack ?? null
  useEffect(() => {
    // Only while actually in a room — never re-set the pack after the room is
    // cleared (game end), which would otherwise re-arm the consent gate.
    if (room_id && !is_host && hostPack && hostPack !== pack) {
      setPack(hostPack)
    }
  }, [hostPack, is_host, pack, setPack, room_id])

  // Gate joiners of a mature room: show the 18+ confirmation before they can
  // stay. Declining leaves the room. (The host already confirmed at create.)
  const needsConsent = !!room_id && !is_host && isMaturePack(pack) && !adultConfirmed
  const recordConsent = async () => {
    setAdultConfirmed(true)
    try {
      // Best-effort server record (works once join-room is redeployed).
      await supabase.functions.invoke('join-room', {
        body: {
          room_code,
          display_name,
          adult_confirmed: true,
          adult_warning_version: ADULT_WARNING_VERSION,
        },
      })
    } catch {
      // Non-fatal — local gate is satisfied regardless.
    }
  }

  const [starting, setStarting] = useState(false)

  const handleStartGame = async () => {
    if (starting) return
    setStarting(true)
    try {
      const { error } = await supabase.functions.invoke('start-game', {
        body: { room_id },
      })
      if (error) {
        console.warn('[lobby] start-game error:', error)
        setStarting(false)
      }
      // On success, navigation happens via game:started broadcast — don't reset starting
    } catch (e) {
      console.warn('[lobby] start-game network error:', e)
      setStarting(false)
    }
  }

  return (
    <ScreenContainer overlay={<LeaveGameButton note={is_host ? 'Leaving passes host to another player.' : undefined} />}>

      {/* Room code */}
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>ROOM CODE</Text>
        <Card highlighted style={styles.codeCard}>
          <Text style={styles.roomCode}>{room_code}</Text>
        </Card>
        <Text style={styles.shareHint}>Share this code with your friends</Text>
      </View>

      {/* Sneak peek button */}
      <View style={{ marginBottom: 16 }}>
        <QuestionsPreviewButton onPress={() => setPreviewVisible(true)} />
      </View>
      <QuestionsPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
      />

      {/* Player list */}
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>
          PLAYERS{players.length > 0 ? ` · ${players.length}` : ''}
        </Text>
        <View style={styles.scrollWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.playerList}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onContentSizeChange={onContentSizeChange}
            onLayout={onLayout}
          >
            {players.map((p) => {
              const isYou = p.player_id === player_id
              return (
                <Card
                  key={p.player_id}
                  style={isYou ? { ...styles.playerCard, ...styles.playerCardYou } : styles.playerCard}
                >
                  <Text style={[styles.playerName, isYou && styles.playerNameYou]}>
                    {p.display_name}{isYou ? ' (you)' : ''}
                  </Text>
                  {p.is_host && <Badge label="HOST" variant="primary" />}
                </Card>
              )
            })}
          </ScrollView>
          <ScrollFadeOverlay showTop={showTopFade} showBottom={showBottomFade} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {is_host ? (
          <>
            {players.length < 2 && (
              <Text style={styles.waitingHint}>Need at least 2 players to start</Text>
            )}
            <Button
              title={starting ? 'Starting...' : 'Start Game'}
              onPress={handleStartGame}
              disabled={players.length < 2 || starting}
            />
          </>
        ) : (
          <Text style={styles.waitingText}>Waiting for host to start...</Text>
        )}
      </View>

      {/* 18+ gate for joiners of a mature room (host confirmed at create). */}
      <AdultConsentGate
        visible={needsConsent}
        onConfirm={recordConsent}
        onCancel={leaveRoom}
      />

    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.label,
  },
  codeCard: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  roomCode: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: 8,
  },
  shareHint: {
    ...Typography.helper,
  },
  body: {
    flex: 1,
    gap: Spacing.sm,
  },
  scrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  playerList: {
    gap: Layout.listItemGap,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerCardYou: {
    borderColor: Colors.primary,
  },
  playerName: {
    ...Typography.body,
  },
  playerNameYou: {
    color: Colors.ink,
  },
  footer: {
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  waitingHint: {
    ...Typography.helper,
    textAlign: 'center',
  },
  waitingText: {
    ...Typography.helper,
    textAlign: 'center',
  },
})
