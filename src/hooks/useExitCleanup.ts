import { useEffect } from 'react'
import { Platform } from 'react-native'
import { usePlayerStore } from '../store/playerStore'
import { getCachedToken } from '../lib/tokenCache'
import { SUPABASE_URL } from '../constants/config'

/**
 * Registers a beforeunload handler that removes the player from their room
 * when they close or navigate away from the browser tab.
 *
 * Uses navigator.sendBeacon so the request fires even as the page unloads.
 * The access_token is read from the synchronous token cache (no async needed).
 *
 * Always routes through leave-room, which handles every case server-side:
 * removes the player, updates the expected submission count, transfers host if
 * the leaver was host, forfeits the turn if the leaver was the QM, and closes
 * the room only if nobody remains. This keeps a host tab-close from ending the
 * whole game — it hands host to another active player instead.
 */
export function useExitCleanup() {
  useEffect(() => {
    if (Platform.OS !== 'web') return

    const handleBeforeUnload = () => {
      const { room_id } = usePlayerStore.getState()
      if (!room_id) return

      const token = getCachedToken()
      if (!token) return

      const payload = JSON.stringify({ room_id, access_token: token })

      navigator.sendBeacon(
        `${SUPABASE_URL}/functions/v1/leave-room`,
        new Blob([payload], { type: 'application/json' })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
