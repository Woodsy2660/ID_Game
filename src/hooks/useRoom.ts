import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { removeChannelByName } from '../lib/channelCleanup'
import type { GameStartPayload } from '../store/types'

interface RoomPlayer {
  player_id: string
  display_name: string
  is_host: boolean
}

interface UseRoomReturn {
  players: RoomPlayer[]
  isConnected: boolean
}

/**
 * Lobby presence + game:started hook — subscribes to a SINGLE Supabase Realtime
 * channel that handles both presence (player list) and broadcast (game:started).
 *
 * Key design decisions:
 *   - Uses `game:${room_code}` as the channel name — this matches the channel the
 *     start-game edge function broadcasts on.
 *   - Force-removes any stale channel before creating a new one. During the lobby
 *     phase useGameChannel is not mounted, so this is safe.
 *   - Cleanup removes the channel. useGameChannel also removes any existing channel
 *     with the same name before creating its own, ensuring only ONE instance exists
 *     per topic at any time (critical for reliable message delivery).
 *   - Uses player_id as the presence key for deduplication.
 */
export function useRoom(
  room_code: string,
  player_id: string,
  display_name: string,
  is_host: boolean,
  onGameStart: (payload: GameStartPayload) => void
): UseRoomReturn {
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const onGameStartRef = useRef(onGameStart)
  onGameStartRef.current = onGameStart

  useEffect(() => {
    // Don't subscribe until we have valid room info
    if (!room_code || !player_id) {
      console.log('[useRoom] Skipping — missing room_code or player_id', { room_code, player_id })
      return
    }

    const channelName = `game:${room_code}`

    console.log('[useRoom] Subscribing to room', { room_code, player_id, display_name, is_host })

    // ── Remove stale channels from previous sessions ─────────────────────
    // Also remove legacy presence-only channel name if it exists.
    removeChannelByName(`room:${room_code}`)
    removeChannelByName(channelName)

    // ── Create a single channel for presence + broadcast ─────────────────
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: player_id },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<RoomPlayer>()
        const list = Object.values(state).flat()
        console.log('[useRoom] Presence sync — players:', list.map(p => p.display_name))
        setPlayers(list)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[useRoom] Player joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[useRoom] Player left:', leftPresences)
      })
      .on('broadcast', { event: 'game:started' }, (event) => {
        console.log('[useRoom] Received game:started broadcast')
        onGameStartRef.current(event.payload as GameStartPayload)
      })
      .subscribe(async (status) => {
        console.log('[useRoom] Channel status:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          const trackResult = await channel.track({ player_id, display_name, is_host })
          console.log('[useRoom] Track result:', trackResult)
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[useRoom] Channel error — will retry')
          setIsConnected(false)
        } else if (status === 'TIMED_OUT') {
          console.warn('[useRoom] Channel timed out — will retry')
          setIsConnected(false)
        }
      })

    return () => {
      console.log('[useRoom] Cleaning up for room', room_code)
      // Remove the channel entirely. useGameChannel will create its own
      // fresh instance when it mounts. If it already removed this channel
      // (because it mounted first), removeChannel is a safe no-op.
      supabase.removeChannel(channel)
    }
  }, [room_code, player_id, display_name, is_host])

  return { players, isConnected }
}
