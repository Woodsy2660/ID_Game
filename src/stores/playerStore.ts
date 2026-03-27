import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storageAdapter } from '../lib/storage'

interface PlayerStore {
  player_id: string | null
  display_name: string | null
  room_id: string | null
  room_code: string | null
  is_host: boolean

  setPlayer: (player_id: string, display_name: string) => void
  setRoom: (room_id: string, room_code: string, is_host: boolean) => void
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
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      ...initialState,

      setPlayer: (player_id, display_name) => set({ player_id, display_name }),

      setRoom: (room_id, room_code, is_host) => set({ room_id, room_code, is_host }),

      clearRoom: () => set({ room_id: null, room_code: null, is_host: false }),

      clearPersistedSession: () => {
        usePlayerStore.persist.clearStorage()
        set(initialState)
      },

      reset: () => set(initialState),
    }),
    {
      name: 'player-session',
      storage: createJSONStorage(() => storageAdapter),
      // Only persist the identity and room fields — not actions
      partialize: (state) => ({
        player_id: state.player_id,
        display_name: state.display_name,
        room_id: state.room_id,
        room_code: state.room_code,
        is_host: state.is_host,
      }),
    }
  )
)
