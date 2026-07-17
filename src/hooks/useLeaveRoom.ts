import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { usePlayerStore } from '../store/playerStore'
import { useGameStore } from '../store/gameStore'
import { removeAllChannels } from '../lib/channelCleanup'

/**
 * Leave the current room from any lobby or game screen.
 *
 * Server-side (leave-room) removes the player, broadcasts player:left so peers
 * recompute the expected submission count, transfers host if the leaver was
 * host, and forfeits the round if the leaver was the current QM. Locally we
 * unsubscribe from all channels and clear game + session state, then return home.
 */
export function useLeaveRoom() {
  const router = useRouter()

  return useCallback(async () => {
    const { room_id } = usePlayerStore.getState()
    try {
      if (room_id) {
        await supabase.functions.invoke('leave-room', { body: { room_id } })
      }
    } catch {
      // Best-effort — local cleanup still runs so the player is never trapped.
    }
    removeAllChannels()
    useGameStore.getState().resetGame()
    usePlayerStore.getState().clearRoom()
    router.replace('/(auth)')
  }, [router])
}
