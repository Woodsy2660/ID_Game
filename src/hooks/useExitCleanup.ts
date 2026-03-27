import { useEffect } from 'react'
import { Platform } from 'react-native'
import { usePlayerStore } from '../stores/playerStore'
import { getCachedToken } from '../lib/tokenCache'
import { SUPABASE_URL } from '../constants/config'

/**
 * Registers a beforeunload handler that removes the player from their room
 * when they close or navigate away from the browser tab.
 *
 * Uses navigator.sendBeacon so the request fires even as the page unloads.
 * The access_token is read from the synchronous token cache (no async needed).
 *
 * Host exits trigger end-game; non-host exits trigger leave-room.
 */
export function useExitCleanup() {
  useEffect(() => {
    if (Platform.OS !== 'web') return

    const handleBeforeUnload = () => {
      const { room_id, is_host } = usePlayerStore.getState()
      if (!room_id) return

      const token = getCachedToken()
      if (!token) return

      const endpoint = is_host ? 'end-game' : 'leave-room'
      const payload = JSON.stringify({ room_id, access_token: token })

      navigator.sendBeacon(
        `${SUPABASE_URL}/functions/v1/${endpoint}`,
        new Blob([payload], { type: 'application/json' })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
