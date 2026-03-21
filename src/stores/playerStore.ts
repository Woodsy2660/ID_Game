import { create } from 'zustand'

interface PlayerStore {
  player_id: string | null
  display_name: string | null
  room_id: string | null
  room_code: string | null
  is_host: boolean

  setPlayer: (player_id: string, display_name: string) => void
  setRoom: (room_id: string, room_code: string, is_host: boolean) => void
  clearRoom: () => void
  reset: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  player_id: null,
  display_name: null,
  room_id: null,
  room_code: null,
  is_host: false,

  setPlayer: (player_id, display_name) => set({ player_id, display_name }),

  setRoom: (room_id, room_code, is_host) => set({ room_id, room_code, is_host }),

  clearRoom: () => set({ room_id: null, room_code: null, is_host: false }),

  reset: () =>
    set({
      player_id: null,
      display_name: null,
      room_id: null,
      room_code: null,
      is_host: false,
    }),
}))
