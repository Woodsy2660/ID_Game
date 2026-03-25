import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { usePlayerStore } from '../../src/stores/playerStore'
import { useGameStore } from '../../src/store/gameStore'
import { useRoom } from '../../src/hooks/useRoom'
import { ScreenContainer } from '../../src/components/ui/ScreenContainer'
import { Button } from '../../src/components/ui/Button'
import { Card } from '../../src/components/ui/Card'
import { Badge } from '../../src/components/ui/Badge'
import { Colors, Spacing, Typography, Layout } from '../../src/theme'
import { QuestionsPreviewButton } from '../../src/components/game/QuestionsPreviewButton'
import { QuestionsPreviewModal } from '../../src/components/game/QuestionsPreviewModal'
import type { GameStartPayload } from '../../src/store/types'

export default function LobbyScreen() {
  const router = useRouter()
  const { room_id, room_code, is_host, player_id, display_name } = usePlayerStore()
  const clearRoom = usePlayerStore((s) => s.clearRoom)
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
      {
        qmPlayerId: payload.qmPlayerId,
        questionId: payload.questionId,
        visibleQuestionIds: payload.visibleQuestionIds,
        roundId: payload.roundId,
      }
    )
    router.push('/(game)/round-start')
  }, [router, player_id, room_code])

  const [previewVisible, setPreviewVisible] = useState(false)

  const { players, isConnected } = useRoom(
    room_code ?? '',
    player_id ?? '',
    display_name ?? '',
    is_host,
    handleGameStart
  )

  const handleStartGame = async () => {
    await supabase.functions.invoke('start-game', {
      body: { room_id },
    })
  }

  return (
    <ScreenContainer>

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.playerList}>
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
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {is_host ? (
          <>
            {players.length < 2 && (
              <Text style={styles.waitingHint}>Need at least 2 players to start</Text>
            )}
            <Button
              title="Start Game"
              onPress={handleStartGame}
              disabled={players.length < 2}
            />
          </>
        ) : (
          <Text style={styles.waitingText}>Waiting for host to start...</Text>
        )}
      </View>

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
    color: Colors.primary,
    letterSpacing: 8,
  },
  shareHint: {
    ...Typography.helper,
  },
  body: {
    flex: 1,
    gap: Spacing.sm,
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
    color: Colors.primary,
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
