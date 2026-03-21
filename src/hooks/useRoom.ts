import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface RoomPlayer {
  player_id: string
  display_name: string
  is_host: boolean
}

interface UseRoomReturn {
  players: RoomPlayer[]
  isConnected: boolean
}

export function useRoom(
  room_code: string,
  player_id: string,
  display_name: string,
  is_host: boolean,
  onGameStart: () => void
): UseRoomReturn {
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const presenceChannel = supabase.channel(`room:${room_code}`)
    const broadcastChannel = supabase.channel(`game:${room_code}`)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<RoomPlayer>()
        const list = Object.values(state).flat()
        setPlayers(list)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          await presenceChannel.track({ player_id, display_name, is_host })
        }
      })

    broadcastChannel
      .on('broadcast', { event: 'game:started' }, () => {
        onGameStart()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(broadcastChannel)
    }
  }, [room_code, player_id, display_name, is_host])

  return { players, isConnected }
}
