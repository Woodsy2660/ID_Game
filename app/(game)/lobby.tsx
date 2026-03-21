import React, { useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { usePlayerStore } from '../../src/stores/playerStore'
import { useGameStore } from '../../src/store/gameStore'
import { useRoom } from '../../src/hooks/useRoom'
import { PlayerList } from '../../src/components/PlayerList'
import { RoomCode } from '../../src/components/RoomCode'
import { Button } from '../../src/components/Button'
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

  const { players, isConnected } = useRoom(
    room_code ?? '',
    player_id ?? '',
    display_name ?? '',
    is_host,
    handleGameStart
  )

  const handleStartGame = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.functions.invoke('start-game', {
      body: { room_id },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Room Code</Text>
        {room_code ? <RoomCode code={room_code} /> : null}
        <Text style={styles.hint}>Share this code with your friends</Text>
      </View>

      <View style={styles.body}>
        <PlayerList
          players={players}
          currentPlayerId={player_id ?? ''}
          hostId={players.find((p) => p.is_host)?.player_id}
        />
      </View>

      <View style={styles.footer}>
        {is_host ? (
          <Button
            label="Start Game"
            onPress={handleStartGame}
            disabled={players.length < 2}
          />
        ) : (
          <Text style={styles.waiting}>Waiting for host to start...</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingTop: 16,
  },
  waiting: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
  },
})
