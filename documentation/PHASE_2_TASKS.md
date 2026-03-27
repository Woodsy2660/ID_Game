# Phase 2 — Claude Code Task List

## Feature Overview

| # | Feature | Scope |
|---|---------|-------|
| 1 | Exit game button | Host ends game from leaderboard, room marked closed, all players redirected |
| 2 | In-progress joins | Late joiners land in current round as answerer only |
| 3 | Crash / exit recovery | Persist session, show rejoin prompt on return |
| 4 | Vote to kick | Simple majority vote, round continues without kicked player |
| 5 | Answer timer | Server starts 3-minute timer, clients display countdown, unanswered auto-skipped |

---

## Database Changes — Run First in Supabase SQL Editor

### 2a. Add columns to existing tables

```sql
-- Add answer phase timer start to rounds
alter table rounds
  add column answer_phase_started_at timestamptz;

-- Add kicked status to room_players
alter table room_players
  add column is_kicked bool default false;

-- Add late join flag to room_players
alter table room_players
  add column is_late_join bool default false;

-- Add closed status support — no column change needed,
-- 'closed' is a new valid value for rooms.status (text field)
-- Document the full valid set:
-- lobby | round_start | qm_active | answer_phase | round_results | leaderboard | closed
```

### 2b. Create kick_votes table

```sql
create table kick_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round_id uuid references rounds(id) on delete cascade,
  target_player_id uuid references profiles(id) on delete cascade,
  voter_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(round_id, target_player_id, voter_id)
);

alter table kick_votes enable row level security;

create policy "kick_votes: anyone can read"
  on kick_votes for select using (true);

create policy "kick_votes: player inserts own vote"
  on kick_votes for insert
  with check (auth.uid() = voter_id);
```

### 2c. Enable Realtime on new table

In Supabase Dashboard → Database → Publications → supabase_realtime:
- Add `kick_votes` to the publication

---

## Feature 1 — Exit Game Button

### Task 1.1 — Edge Function: `end-game`

Create `supabase/functions/end-game/index.ts`

**Input:**
```ts
{ room_id: string }
```

**Logic:**
1. Parse JWT, get `auth.uid()`
2. Verify caller is host of the room (`room_players.is_host = true`)
3. Return 403 if not host
4. Update `rooms` set `status = 'closed'` where `id = room_id`
5. Broadcast `game:ended` on `game:{room_code}` channel
6. Return `{ success: true }`

**Deploy:**
```bash
supabase functions deploy end-game --no-verify-jwt
```

---

### Task 1.2 — Client: Add exit button to leaderboard screen

In the leaderboard screen component:

- Render an "End Game" button **only when** `is_host === true`
- Position it below the leaderboard scores, visually separated
- On tap: show a confirmation dialog — "Are you sure you want to end the game for everyone?"
- On confirm: call `supabase.functions.invoke('end-game', { body: { room_id } })`
- Show loading state on button while function runs

---

### Task 1.3 — Client: Handle `game:ended` broadcast on all screens

In the game broadcast channel subscription (wherever `useGame` or the game shell layout manages the channel):

Add a listener for the `game:ended` event:

```ts
channel.on('broadcast', { event: 'game:ended' }, () => {
  clearRoom()         // clear Zustand player store
  clearPersistedSession()  // clear persisted store (see Feature 3)
  router.replace('/')  // redirect to home screen
})
```

This listener must be active on **every game screen** — not just the leaderboard — so if the host exits mid-round all players are redirected immediately.

---

## Feature 2 — In-Progress Joins

### Task 2.1 — Update Edge Function: `join-room`

Modify `supabase/functions/join-room/index.ts`

**Change:** Remove the `ROOM_NOT_IN_LOBBY` hard block. Replace with conditional logic:

```ts
if (room.status === 'closed') {
  return new Response(
    JSON.stringify({ error: 'ROOM_CLOSED' }),
    { status: 409 }
  )
}

// status === 'lobby' → normal join
// any active game status → late join path
const isLateJoin = room.status !== 'lobby'
```

**For late joins:**
1. Insert to `room_players` with `is_late_join: true`, `is_host: false`
2. Fetch current room state: `status`, `current_qm_id`, `current_round`
3. Fetch current round row to get `question_id` and `answer_phase_started_at`
4. Return full game state so client can navigate to the correct screen:

```ts
return {
  room_id,
  room_code,
  is_late_join: true,
  current_status: room.status,
  current_qm_id: room.current_qm_id,
  current_round_id: round.id,
  question_id: round.question_id,
  answer_phase_started_at: round.answer_phase_started_at
}
```

**Update error handling on join screen:**
- `ROOM_CLOSED` → "This game has already ended."
- Remove the `ROOM_NOT_IN_LOBBY` error message, it will no longer be returned

**Redeploy:**
```bash
supabase functions deploy join-room --no-verify-jwt
```

---

### Task 2.2 — Client: Late join navigation

In the join room screen, after `join-room` returns:

```ts
if (data.is_late_join) {
  // Store room as normal
  setRoom(data.room_id, data.room_code, false)

  // Navigate based on current game status
  switch (data.current_status) {
    case 'qm_active':
      router.replace('/game/waiting')  // show waiting screen, round in progress
      break
    case 'answer_phase':
      router.replace('/game/answer')   // drop straight into answer screen
      break
    case 'round_results':
    case 'leaderboard':
      router.replace('/game/leaderboard')
      break
    default:
      router.replace('/game/round')
  }
} else {
  router.replace('/lobby')
}
```

---

### Task 2.3 — Client: Late joiner waiting screen

Create `app/(game)/waiting.tsx`

This screen is shown to late joiners when they arrive during `qm_active` status.

**UI:**
- "A round is in progress" message
- Spinner
- Player list showing who is currently in the game
- "You'll join the action shortly..." subtext

**Behaviour:**
- Subscribe to `game:{room_code}` broadcast channel
- On `qm:ready` event (answer phase starts): navigate to `/game/answer`
- On `round:results` event: navigate to `/game/leaderboard`
- On `game:ended` event: redirect to home

**Scoring note:** Late joiners who arrive during `qm_active` and make it to the answer phase can score normally. Late joiners who arrive during `answer_phase` or later in that round score 0 for that round — their `round_answers` row is simply never created for that round and `submit-answer` edge function must account for them when checking if all players have answered (see Task 5.3).

---

### Task 2.4 — Update `submit-answer` edge function (partner scope — document only)

Add a note in `PARTNER_HANDOFF.md`:

When checking if all players have answered, the query must exclude:
- Players where `is_kicked = true`
- The current QM
- Late joiners who joined after `answer_phase_started_at` for that round

```ts
const eligiblePlayers = allPlayers.filter(p =>
  p.player_id !== currentQMId &&
  !p.is_kicked &&
  !(p.is_late_join && joinedAfterPhaseStarted(p.joined_at, round.answer_phase_started_at))
)
```

---

## Feature 3 — Crash / Exit Recovery

### Task 3.1 — Persist player store across sessions

In `src/stores/playerStore.ts`, add persistence using Zustand's persist middleware:

```ts
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Wrap the store with persist middleware
// Use AsyncStorage on native, localStorage on web
const storage = Platform.OS === 'web'
  ? createJSONStorage(() => localStorage)
  : createJSONStorage(() => AsyncStorage)

export const usePlayerStore = create(
  persist(
    (set) => ({
      // ...existing store shape unchanged
    }),
    {
      name: 'player-session',
      storage,
    }
  )
)
```

Install AsyncStorage if not already present:
```bash
npx expo install @react-native-async-storage/async-storage
```

Add a `clearPersistedSession` action to the store:
```ts
clearPersistedSession: () => {
  usePlayerStore.persist.clearStorage()
  set(initialState)
}
```

---

### Task 3.2 — Rejoin check on app launch

In `app/_layout.tsx`, after auth session is restored, add a rejoin check:

```ts
useEffect(() => {
  const checkRejoin = async () => {
    const { room_id, room_code } = usePlayerStore.getState()

    if (!room_id || !session) return

    // Check if room is still active
    const { data: room } = await supabase
      .from('rooms')
      .select('status')
      .eq('id', room_id)
      .single()

    if (!room || room.status === 'closed' || room.status === 'lobby') {
      clearRoom()
      return
    }

    // Room is active — show rejoin prompt
    setShowRejoinPrompt(true)
  }

  checkRejoin()
}, [session])
```

---

### Task 3.3 — Rejoin prompt component

Create `src/components/RejoinPrompt.tsx`

**UI:**
- Modal overlay on the home screen
- "You were in a game! Want to rejoin?" message
- Shows the room code
- "Rejoin" button → navigates back to correct game screen based on `room.status`
- "Leave game" button → calls `clearRoom()`, dismisses prompt

**Navigation on rejoin** (same logic as late join in Task 2.2):
```ts
const handleRejoin = async () => {
  const { room_id, room_code } = usePlayerStore.getState()

  const { data: room } = await supabase
    .from('rooms')
    .select('status, current_qm_id')
    .eq('id', room_id)
    .single()

  switch (room.status) {
    case 'lobby':         router.replace('/lobby'); break
    case 'qm_active':     router.replace('/game/round'); break
    case 'answer_phase':  router.replace('/game/answer'); break
    case 'round_results': router.replace('/game/leaderboard'); break
    case 'leaderboard':   router.replace('/game/leaderboard'); break
    default:              clearRoom()
  }
}
```

**On "Leave game":**
- Call a `leave-room` edge function (Task 3.4) to remove the player from `room_players`
- Call `clearPersistedSession()`
- Dismiss prompt

---

### Task 3.4 — Edge Function: `leave-room`

Create `supabase/functions/leave-room/index.ts`

**Input:**
```ts
{ room_id: string }
```

**Logic:**
1. Get `auth.uid()`
2. Verify player is in the room
3. If player is host:
   - Do NOT delete or close the room automatically
   - Return `{ error: 'HOST_CANNOT_LEAVE' }` with a 400
   - Host must use the end-game button instead
4. If regular player:
   - Delete their row from `room_players`
   - Broadcast `player:left` on `game:{room_code}` with `{ player_id }`
   - Return `{ success: true }`

**Deploy:**
```bash
supabase functions deploy leave-room --no-verify-jwt
```

---

## Feature 4 — Vote to Kick

### Task 4.1 — Edge Function: `vote-kick`

Create `supabase/functions/vote-kick/index.ts`

**Input:**
```ts
{ room_id: string, round_id: string, target_player_id: string }
```

**Logic:**
1. Get `auth.uid()` as `voter_id`
2. Validate voter is in the room and not kicked themselves
3. Validate target is in the room and not already kicked
4. Validate voter is not voting to kick themselves
5. Insert to `kick_votes`: `{ room_id, round_id, target_player_id, voter_id }`
6. Count total eligible voters (all active non-kicked players except target)
7. Count votes against target for this round
8. Check if majority reached: `vote_count > eligible_voters / 2`
9. If majority reached:
   - Update `room_players` set `is_kicked = true` where `player_id = target_player_id`
   - Broadcast `player:kicked` on `game:{room_code}`:
     ```ts
     { target_player_id, display_name }
     ```
   - Check if this kick means all remaining eligible players have now answered
   - If yes: trigger round completion (call same logic as submit-answer completion check)
10. Broadcast `kick:vote_update` regardless of threshold:
    ```ts
    { target_player_id, vote_count, votes_needed, eligible_voters }
    ```
11. Return `{ kicked: boolean, vote_count, votes_needed }`

**Deploy:**
```bash
supabase functions deploy vote-kick --no-verify-jwt
```

---

### Task 4.2 — Client: Vote to kick UI on answer screen

On the answerer screen, add a way to initiate a kick vote.

**Trigger:** A "flag player" icon or button next to each player's name in the player list. Keep it subtle — not a prominent button.

**Flow:**
1. Player taps flag icon next to a player's name
2. Confirmation dialog: "Vote to remove [name] from this round? A majority vote is needed."
3. On confirm: call `vote-kick` edge function
4. Show toast: "Your vote has been cast"
5. Disable the flag button for that player after voting (one vote per player per round)

**Vote progress display:**
- When `kick:vote_update` is received on the broadcast channel, show a subtle indicator near the flagged player: "2/4 votes to remove"
- When `player:kicked` is received:
  - Show a brief toast: "[Name] has been removed from this round"
  - Remove that player from the visible player list
  - If the kicked player is viewing on their own device: show a screen "You have been removed from this round. You will rejoin next round."

---

### Task 4.3 — Client: Handle kicked player state

When `player:kicked` broadcast is received, every client must:

1. Check if `target_player_id === my_player_id`
   - If yes: show "You were voted out of this round" screen with a wait indicator. Rejoin next round automatically when `leaderboard:update` is broadcast.
   - If no: remove that player from any local player lists being rendered

2. Update local player list state to mark that player as inactive for the current round

3. The kicked player's `is_kicked` flag in the database is `true` permanently for the session — they cannot be QM or have their answer counted for any future round either. This is intentional for the case where they are no longer physically present.

> **Design note:** If the intent is that kicked = removed for this round only (player rejoins next round), change the logic to soft-kick: add a `kicked_in_round` int column to `room_players` instead of a boolean, and only exclude them from rounds where `kicked_in_round = current_round`. Clarify this with the team before implementing.

---

## Feature 5 — Answer Timer (3 Minutes, Server-Authoritative)

### Task 5.1 — Schema: track timer start on rounds

Already added in the database migration at the top of this file:
```sql
rounds.answer_phase_started_at timestamptz
```

This is written by the edge function that transitions to `answer_phase`. The partner's `start-answer-phase` (or equivalent) function must set this field when it updates room status to `answer_phase`.

---

### Task 5.2 — Edge Function: `expire-round`

Create `supabase/functions/expire-round/index.ts`

This function is called when the 3-minute timer expires. It is triggered by the client that detects expiry (all clients count down from `answer_phase_started_at` — first one to hit zero calls this function, others are idempotent).

**Input:**
```ts
{ room_id: string, round_id: string }
```

**Logic:**
1. Fetch the round — confirm `answer_phase_started_at` is set
2. Verify `now() >= answer_phase_started_at + interval '3 minutes'`
   - If not yet expired: return `{ expired: false }` — prevents premature calls
3. Check room status is still `answer_phase` — if already moved on, return early
4. Find all eligible players who have NOT submitted an answer for this round:
   - Not the QM
   - Not kicked
   - Not a late joiner who arrived after phase started
5. For each unanswered player: insert a `round_answers` row with `is_correct: false`
6. Calculate scores as normal (only correct answers score)
7. Update room status → `round_results`
8. Broadcast `round:results` with per-player correct/wrong
9. Return `{ expired: true }`

**Deploy:**
```bash
supabase functions deploy expire-round --no-verify-jwt
```

---

### Task 5.3 — Client: Display countdown timer

In the answerer screen and QM screen, add a countdown timer component.

**Create `src/components/CountdownTimer.tsx`**

**Props:**
```ts
interface CountdownTimerProps {
  answerPhaseStartedAt: string  // ISO timestamp from round row
  durationSeconds?: number      // default 180 (3 minutes)
  onExpire: () => void          // called when timer hits zero
}
```

**Logic:**
```ts
const elapsed = (Date.now() - new Date(answerPhaseStartedAt).getTime()) / 1000
const remaining = Math.max(0, durationSeconds - elapsed)
```

- Recalculate every second using `setInterval`
- Display as `MM:SS` format
- Change colour to amber when under 60 seconds
- Change colour to red when under 30 seconds
- On hitting zero: call `onExpire()`

**`onExpire` handler on answerer screen:**
```ts
const handleExpire = () => {
  supabase.functions.invoke('expire-round', {
    body: { room_id, round_id }
  })
  // The broadcast from expire-round will handle navigation
  // Do not navigate directly here
}
```

The `expire-round` function is idempotent — multiple clients calling it simultaneously is safe because of the status check in step 3 of its logic.

---

### Task 5.4 — Fetch `answer_phase_started_at` for late joiners and rejoining players

When a player rejoins or joins late and lands on the answer screen, they need `answer_phase_started_at` to initialise the timer correctly.

In `join-room` edge function (already updated in Task 2.1), this value is already returned in the late-join response. Ensure it is stored in the player store or passed as a route param when navigating to the answer screen.

In the rejoin flow (Task 3.3), fetch the current round's `answer_phase_started_at` when determining where to navigate:

```ts
const { data: round } = await supabase
  .from('rounds')
  .select('id, question_id, answer_phase_started_at')
  .eq('room_id', room_id)
  .eq('round_number', room.current_round)
  .single()
```

Pass this to the answer screen so the timer initialises from the correct server time, not from when the player arrived.

---

## Deployment Checklist

Run these deploys after all functions are written:

```bash
supabase functions deploy end-game --no-verify-jwt
supabase functions deploy join-room --no-verify-jwt
supabase functions deploy leave-room --no-verify-jwt
supabase functions deploy vote-kick --no-verify-jwt
supabase functions deploy expire-round --no-verify-jwt
```

---

## Smoke Test Checklist

### Exit game
- [ ] End Game button only visible to host on leaderboard screen
- [ ] Confirmation dialog appears before ending
- [ ] All players redirected to home screen immediately on confirm
- [ ] Room status in Supabase shows `closed`
- [ ] Player store is cleared on all devices after exit

### In-progress joins
- [ ] Player joining a room with active game receives game state in response
- [ ] Late joiner during `qm_active` lands on waiting screen
- [ ] Late joiner during `answer_phase` lands on answer screen with correct timer
- [ ] Late joiner is never assigned as QM
- [ ] Round completes correctly with late joiner included in eligible player count

### Crash / exit recovery
- [ ] Refreshing the browser restores the session and shows rejoin prompt
- [ ] Swiping out of mobile app and returning shows rejoin prompt
- [ ] Rejoining navigates to the correct screen for the current game status
- [ ] "Leave game" option removes player from room_players
- [ ] Rejoining as host still shows host controls

### Vote to kick
- [ ] Flag button appears next to other players on answer screen
- [ ] Cannot vote to kick yourself
- [ ] Vote count updates in real time for all players
- [ ] Kick triggers when 50%+ threshold is met
- [ ] Kicked player sees removal message on their device
- [ ] Round completes correctly after a kick (kicked player's answer skipped)
- [ ] Kicked player rejoins on next round

### Timer
- [ ] Countdown displays correctly on all connected devices simultaneously
- [ ] Timer starts from `answer_phase_started_at`, not from when player loaded the screen
- [ ] Timer turns amber under 60 seconds
- [ ] Timer turns red under 30 seconds
- [ ] On expiry: unanswered players receive `is_correct: false` automatically
- [ ] Round advances to results after expiry
- [ ] Multiple clients calling expire-round simultaneously does not cause duplicate results
- [ ] Late joiner timer starts from correct server time, not from join time

---

## Notes for Partner

The following changes affect the partner's existing edge functions:

**`start-answer-phase` (or equivalent):**
Must now write `answer_phase_started_at = now()` to the `rounds` row when transitioning to `answer_phase` status.

**`submit-answer`:**
When checking if all players have answered, must exclude:
- `is_kicked = true` players
- Current QM
- Late joiners who joined after `answer_phase_started_at`

**`next-round`:**
When rotating QM, must skip players where `is_kicked = true`.

**Broadcast `game:ended`:**
Must be handled on all game screens, not just leaderboard.
