# Architecture

## Guiding Principles

1. **Server owns all game state.** Clients are views only. No client decides when to advance the game — they react to server-emitted events.
2. **Minimal writes from client.** Sensitive state transitions (start game, next round, score calculation) happen inside Edge Functions, not direct DB writes from the app.
3. **One codebase, three platforms.** Expo allows iOS, Android, and Web from a single React Native codebase.
4. **Realtime is for notifications, not storage.** Game state lives in the database. Realtime tells clients to re-render based on what changed.

---

## Tech Stack

### Expo (React Native + Web)
Chosen over separate React (web) and React Native (mobile) codebases because:
- The game is intended for both mobile (primary) and web (secondary / desktop fallback)
- Expo's universal build targets iOS, Android, and Web from one repo
- Expo Router provides file-based navigation that works across platforms
- The UI is simple enough that platform-specific native components are not required

### Supabase
Chosen as the Backend-as-a-Service for:
- **Postgres database** — relational, strongly typed, supports RLS natively
- **Anonymous auth** — players don't need accounts, just a display name
- **Realtime** — built-in WebSocket layer for presence and broadcast, no separate socket server needed
- **Edge Functions** — server-side logic co-located with the database, no separate API server to deploy or maintain
- **Low operational overhead** — no infrastructure to manage for an MVP

### Supabase Anonymous Auth
Players do not create accounts. On first launch the app calls `supabase.auth.signInAnonymously()` and stores the session via `expo-secure-store`. The player then enters a display name which is saved to the `profiles` table. The anonymous session persists across app restarts. This keeps the onboarding flow to a single screen.

### Static Question Bank
The 186 questions are a JSON file bundled directly with the Expo app. This avoids:
- A questions API endpoint
- Database queries per round
- Network dependency during gameplay

The Edge Function that starts a round reads the question index from the bundle-side, picks a random unused ID, and stores only the integer ID in the database. Both client and server resolve the full question text by indexing into the same static file.

---

## System Design

### Game State Machine

All game state is represented by the `status` field on the `rooms` table. The server is the only entity that writes to this field. Clients subscribe to changes and render accordingly.

```
lobby → round_start → qm_active → answer_phase → round_results → leaderboard → round_start (loop)
```

| Status | Who sees what |
|--------|--------------|
| `lobby` | All players in lobby screen |
| `round_start` | Brief transition, QM name shown |
| `qm_active` | QM sees question, answerers wait |
| `answer_phase` | Answerers see 10-question picker |
| `round_results` | Green / red result per player |
| `leaderboard` | All players see scores |

### Role Derivation

Roles are never stored on a player row. They are derived at runtime:

```ts
const isHost = roomPlayer.is_host

// Derived each round from rooms.current_qm_id
const isQM = room.current_qm_id === session.user.id
const isAnswerer = !isQM
```

This means:
- `is_host` on `room_players` is permanent and controls lobby UI only
- `current_qm_id` on `rooms` changes each round and controls which game screen is rendered
- No row updates needed to "assign" a role — one field change on `rooms` drives the entire client-side role logic

---

## Realtime Strategy

Two channels are used per game session.

### Presence Channel — `room:{room_code}`
**Purpose:** Track who is online and connected in the lobby.

Each client joins with their player metadata when they enter the lobby. The lobby screen subscribes to presence state to build the live player list. When a player disconnects, presence automatically removes them from the list.

```ts
const channel = supabase.channel(`room:${roomCode}`)
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  // render player list from state
})
channel.track({ player_id, display_name })
```

### Broadcast Channel — `game:{room_code}`
**Purpose:** Server-to-client game state transitions.

Edge Functions broadcast events on this channel after mutating the database. Clients listen and navigate accordingly.

| Event | Trigger | Client reaction |
|-------|---------|----------------|
| `game:started` | Host taps Start | All clients leave lobby |
| `qm:question_drawn` | Round starts | QM renders question screen |
| `qm:ready` | QM taps Ready | Answerers get question picker |
| `round:all_answered` | Last answer submitted | Transition to results |
| `round:results` | Score calculation complete | Green / red per player |
| `leaderboard:update` | Results shown | All players see leaderboard |

---

## Edge Functions

Edge Functions run server-side Deno code inside Supabase. They are the only entities that:
- Write `rooms.status`
- Write `rooms.current_qm_id`
- Calculate and write scores
- Broadcast game events

Clients call Edge Functions via `supabase.functions.invoke(...)`. They never write directly to game-sensitive tables.

### Functions in Scope (MVP — Partner Build)

| Function | Responsibility |
|----------|---------------|
| `create-room` | Generate room code, create room row, add host to room_players |
| `join-room` | Validate code, add player to room_players |
| `start-game` | Validate host, pick first QM, draw question, broadcast game:started |
| `submit-answer` | Save answer, check if all answered, calculate scores if complete |
| `next-round` | Rotate QM, draw new question, broadcast leaderboard:update |

> `create-room` and `join-room` are part of this MVP build. All game-phase functions are the partner's responsibility.

---

## Data Flow — Lobby Phase (This Build)

```
Player opens app
    ↓
Anonymous auth (signInAnonymously)
Session stored in SecureStore
    ↓
Home Screen — enter display name
Profile saved to profiles table
    ↓
[Host path]                          [Joiner path]
Tap "Create Room"                    Tap "Join Room"
Call create-room edge fn             Enter 6-char code
Room row created in DB               Call join-room edge fn
Host added to room_players           Player added to room_players
Navigate to Lobby                    Navigate to Lobby
    ↓                                    ↓
Both paths → Lobby Screen
Subscribe to presence channel room:{code}
Subscribe to broadcast channel game:{code}
    ↓
Host sees player list + Start button
Joiners see player list + "Waiting for host..."
    ↓
Host taps Start → calls start-game edge fn (partner territory)
```

---

## Security Model

- **RLS on all tables** — every query is scoped by `auth.uid()`
- **Clients never write game state** — only Edge Functions do
- **Room codes are not secret** — they are convenience identifiers, not security tokens. Security is enforced by RLS, not by obscuring codes.
- **Anonymous sessions are persistent** — stored in SecureStore, survive app restarts. If cleared, the player gets a new anonymous identity (expected behaviour for a party game).
- **No sensitive data** — display names only, no PII collected
