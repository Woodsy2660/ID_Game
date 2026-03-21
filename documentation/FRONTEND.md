# Frontend

## Tech Stack

| Tool | Purpose |
|------|---------|
| Expo SDK | Universal build for iOS, Android, Web |
| Expo Router | File-based navigation |
| React Native | UI components |
| Supabase JS client | Auth, database, realtime |
| expo-secure-store | Persistent session storage |
| react-native-gesture-handler | Touch interactions |
| react-native-safe-area-context | Safe area insets |

---

## Project Structure

```
app/
├── (auth)/
│   └── index.tsx              ← Home screen — display name entry + host/join
├── (game)/
│   ├── create.tsx             ← Create room screen
│   ├── join.tsx               ← Join room screen
│   ├── lobby.tsx              ← Shared lobby screen
│   └── _layout.tsx            ← Game shell layout (subscribes to broadcast channel)
├── _layout.tsx                ← Root layout — auth provider
└── +not-found.tsx

src/
├── lib/
│   └── supabase.ts            ← Supabase client initialisation
├── hooks/
│   ├── useAuth.ts             ← Anonymous auth, session management
│   ├── useRoom.ts             ← Room state, presence channel
│   └── useGame.ts             ← Broadcast channel, game state (partner scope)
├── stores/
│   └── playerStore.ts         ← Zustand store for local player state
├── components/
│   ├── PlayerList.tsx         ← Lobby player list component
│   ├── RoomCode.tsx           ← Styled room code display
│   └── Button.tsx             ← Base button component
└── constants/
    ├── questions.json         ← Full 186-question bank
    └── config.ts              ← Supabase URL and anon key
```

---

## Screen Map

### Home Screen `/`
Entry point. Shown on first launch and whenever the player is not in an active room.

**State:** Display name input, Host / Join selection

**Actions:**
- Enter display name (required before proceeding)
- Tap "Create Room" → navigates to `/create`
- Tap "Join Room" → navigates to `/join`

**Auth behaviour:** Calls `supabase.auth.signInAnonymously()` on mount if no session exists. Session is stored via `expo-secure-store`. Subsequent launches restore the session silently.

---

### Create Room Screen `/create`
Host flow. Calls the `create-room` edge function.

**State:** Loading while function executes, then shows generated room code

**Actions:**
- Room code is displayed prominently for host to share verbally with the group
- "Share Code" copies to clipboard
- Navigates automatically to `/lobby` once room is created

**Data needed in lobby:**
```ts
{ room_id, room_code, player_id, is_host: true }
```

---

### Join Room Screen `/join`
Joiner flow. Calls the `join-room` edge function.

**State:** 6-character code input

**Actions:**
- Enter room code (auto-capitalised, max 6 chars)
- Tap "Join" → validates and navigates to `/lobby`
- Error states: room not found, game already started

---

### Lobby Screen `/lobby`
Shared screen for all players. Host and joiners land here after room creation / join.

**State:** Live player list, game start control (host only)

**Realtime:**
- Subscribes to presence channel `room:{room_code}` on mount
- Unsubscribes on unmount
- Player list updates in real time as players join and leave

**Host view:**
- Player list with count (e.g. "Players 4/8")
- "Start Game" button — enabled when ≥ 2 players present
- Calls `start-game` edge function on tap

**Joiner view:**
- Same player list
- "Waiting for host to start..." message

**Broadcast subscription:**
- Listens on `game:{room_code}` for `game:started` event
- On receipt: all clients navigate to game shell (partner scope)

---

## Supabase Client Setup

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

---

## Auth Hook

```ts
// src/hooks/useAuth.ts
// Responsibilities:
// - Sign in anonymously if no session
// - Expose session, user, loading state
// - Provide setDisplayName helper that upserts profiles table
```

Key behaviours:
- `signInAnonymously()` is called once per device install
- Display name is stored in `profiles` table, not in the auth user metadata
- `useAuth` is called at the root layout level and passed down via context

---

## Room Hook

```ts
// src/hooks/useRoom.ts
// Responsibilities:
// - Subscribe to presence channel on mount
// - Return live player list from presence state
// - Expose joinPresence() and leavePresence() helpers
// - Subscribe to broadcast channel for game:started event
```

---

## Player Store

```ts
// src/stores/playerStore.ts
// Zustand store — persists for the session
// Shape:
{
  player_id: string
  display_name: string
  room_id: string | null
  room_code: string | null
  is_host: boolean
}
```

This store is the single source of truth for the current player's identity and room membership. It is populated on room creation / join and read throughout the game shell.

---

## Navigation Flow

```
/ (Home)
├── /create (host path)
│   └── → /lobby
└── /join (joiner path)
    └── → /lobby
        └── → /game/* (partner scope, triggered by game:started broadcast)
```

---

## MVP Scope Boundary

This build delivers:
- `/` Home screen with auth and display name
- `/create` screen and `create-room` integration
- `/join` screen and `join-room` integration
- `/lobby` screen with live presence and host start button

The partner build picks up from the `game:started` broadcast event and owns everything under `/game/*`. The hand-off point is:

```ts
// In lobby.tsx — this is where partner code takes over
channel.on('broadcast', { event: 'game:started' }, (payload) => {
  router.push('/game/round')
})
```

The partner's screens receive room context from the shared player store.

---

## Environment Variables

Store in `.env.local` at project root. Never commit.

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Access in code:
```ts
// src/constants/config.ts
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
```

---

## Platform Notes

### iOS
- `expo-secure-store` works natively via Keychain
- Safe area insets required for notch / Dynamic Island

### Android
- `expo-secure-store` works via Android Keystore
- Back button behaviour handled by React Navigation

### Web
- `expo-secure-store` falls back to `localStorage` on web
- Room code entry benefits from keyboard auto-focus on web
