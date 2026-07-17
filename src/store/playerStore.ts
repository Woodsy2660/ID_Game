import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storageAdapter } from '../lib/storage'
import type { PackId } from './types'

interface PlayerStore {
  player_id: string | null
  display_name: string | null
  room_id: string | null
  room_code: string | null
  is_host: boolean
  pack: PackId | null
  /**
   * Session-only mature-pack confirmation. Deliberately NOT persisted — a
   * restored local state must never satisfy the 18+ gate on its own; it is
   * re-derived from the server on every entry (create/join/rejoin).
   */
  adult_confirmed: boolean
  /** When this session was last persisted — used to purge stale local state. */
  session_saved_at: number | null

  setPlayer: (player_id: string, display_name: string) => void
  setRoom: (room_id: string, room_code: string, is_host: boolean, pack: PackId) => void
  setPack: (pack: PackId) => void
  setAdultConfirmed: (confirmed: boolean) => void
  setHost: (is_host: boolean) => void
  clearRoom: () => void
  clearPersistedSession: () => void
  reset: () => void
}

const initialState = {
  player_id: null,
  display_name: null,
  room_id: null,
  room_code: null,
  is_host: false,
  pack: null as PackId | null,
  adult_confirmed: false,
  session_saved_at: null as number | null,
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      ...initialState,

      setPlayer: (player_id, display_name) => set({ player_id, display_name }),

      setRoom: (room_id, room_code, is_host, pack) =>
        set({ room_id, room_code, is_host, pack, session_saved_at: Date.now() }),

      setPack: (pack) => set({ pack }),

      setAdultConfirmed: (confirmed) => set({ adult_confirmed: confirmed }),

      setHost: (is_host) => set({ is_host }),

      clearRoom: () =>
        set({
          room_id: null,
          room_code: null,
          is_host: false,
          pack: null,
          adult_confirmed: false,
        }),

      clearPersistedSession: () => {
        usePlayerStore.persist.clearStorage()
        set(initialState)
      },

      reset: () => set(initialState),
    }),
    {
      name: 'player-session',
      storage: createJSONStorage(() => storageAdapter),
      // Persist identity + room only. adult_confirmed is intentionally excluded
      // so it cannot be restored from disk to bypass the mature-content gate.
      partialize: (state) => ({
        player_id: state.player_id,
        display_name: state.display_name,
        room_id: state.room_id,
        room_code: state.room_code,
        is_host: state.is_host,
        pack: state.pack,
        session_saved_at: state.session_saved_at,
      }),
    }
  )
)
