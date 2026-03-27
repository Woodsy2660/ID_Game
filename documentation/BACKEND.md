# Backend Design

## Supabase Project Setup

- Database: Postgres (managed by Supabase)
- Auth: Anonymous auth enabled
- Realtime: Enabled on `room_players` table
- Edge Functions: Deno runtime

---

## Database Schema

### `profiles`
Stores display names for all players. Created automatically on first sign-in via a database trigger or explicit insert after anonymous auth.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Matches `auth.users.id` exactly |
| `display_name` | text | Set on first launch, shown in lobby |
| `created_at` | timestamptz | Auto-set |

---

### `rooms`
One row per active game session.

```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references profiles(id) on delete cascade,
  status text default 'lobby',
  current_round int default 0,
  current_qm_id uuid references profiles(id),
  used_question_ids int[] default '{}',
  created_at timestamptz default now()
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Internal identifier |
| `code` | text | 6-char unique room code shown to players |
| `host_id` | uuid | FK to profiles — room creator |
| `status` | text | Game state machine value — see below |
| `current_round` | int | Increments each round |
| `current_qm_id` | uuid | FK to profiles — who is QM this round |
| `used_question_ids` | int[] | Prevents question repeats within a session |
| `created_at` | timestamptz | Auto-set |

**Status enum values:**

| Value | Meaning |
|-------|---------|
| `lobby` | Players joining, host has not started |
| `round_start` | Brief transition between rounds |
| `qm_active` | QM viewing question, group arranging physically |
| `answer_phase` | Answerers submitting guesses |
| `round_results` | Correct/wrong shown to each player |
| `leaderboard` | Scores shown, next round pending |

---

### `room_players`
One row per player per session. Tracks lobby membership and scores.

```sql
create table room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  player_id uuid references profiles(id) on delete cascade,
  display_name text not null,
  score int default 0,
  is_host bool default false,
  joined_at timestamptz default now(),
  unique(room_id, player_id)
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Internal identifier |
| `room_id` | uuid | FK to rooms |
| `player_id` | uuid | FK to profiles |
| `display_name` | text | Denormalised for quick lobby rendering |
| `score` | int | Cumulative across all rounds |
| `is_host` | bool | True only for room creator — permanent |
| `joined_at` | timestamptz | Used to determine QM rotation order |

**Important:** `is_host` is the only persistent role. The Question Master role is derived each round from `rooms.current_qm_id` — it is never stored on this table.

---

### `rounds`
One row per round per session. Created by the `start-game` and `next-round` edge functions.

```sql
create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round_number int not null,
  qm_id uuid references profiles(id),
  question_id int not null,
  created_at timestamptz default now()
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Internal identifier |
| `room_id` | uuid | FK to rooms |
| `round_number` | int | Matches `rooms.current_round` |
| `qm_id` | uuid | Who was QM for this round |
| `question_id` | int | Index into the static question JSON |
| `created_at` | timestamptz | Auto-set |

---

### `round_answers`
One row per player per round (excluding QM). Created when an answerer submits.

```sql
create table round_answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references profiles(id) on delete cascade,
  guessed_question_id int not null,
  is_correct bool,
  submitted_at timestamptz default now(),
  unique(round_id, player_id)
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Internal identifier |
| `round_id` | uuid | FK to rounds |
| `player_id` | uuid | FK to profiles |
| `guessed_question_id` | int | What the player thought the question was |
| `is_correct` | bool | Set by `submit-answer` edge function |
| `submitted_at` | timestamptz | Auto-set |

---

## Row Level Security

RLS is enabled on all tables. Policies are intentionally permissive for reads (party game — no private data) and restricted for writes.

```sql
-- Profiles
alter table profiles enable row level security;

create policy "profiles: owner can read and write"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Rooms
alter table rooms enable row level security;

create policy "rooms: anyone can read"
  on rooms for select
  using (true);

create policy "rooms: host can insert"
  on rooms for insert
  with check (auth.uid() = host_id);

-- Room Players
alter table room_players enable row level security;

create policy "room_players: anyone can read"
  on room_players for select
  using (true);

create policy "room_players: player can insert themselves"
  on room_players for insert
  with check (auth.uid() = player_id);

-- Rounds
alter table rounds enable row level security;

create policy "rounds: anyone can read"
  on rounds for select
  using (true);

-- round_answers
alter table round_answers enable row level security;

create policy "round_answers: player can read own"
  on round_answers for select
  using (auth.uid() = player_id);

create policy "round_answers: player can insert own"
  on round_answers for insert
  with check (auth.uid() = player_id);
```

> Direct inserts to `rooms` and `rounds` from game logic should go through Edge Functions which use the service role key, bypassing RLS. Client-side inserts are only permitted for the two cases above.

---

## Realtime Configuration

### Enable on Tables
Go to Supabase Dashboard → Database → Replication and enable:
- `room_players` — for lobby presence updates

### Presence Channel
Used in the lobby to track connected players. Each client joins the channel on lobby entry and leaves on exit.

**Channel name pattern:** `room:{room_code}`

**Tracked payload per player:**
```ts
{
  player_id: string,
  display_name: string
}
```

### Broadcast Channel
Used by Edge Functions to push game state transitions to all clients.

**Channel name pattern:** `game:{room_code}`

**Events:**

| Event | Payload | Sent by |
|-------|---------|---------|
| `game:started` | `{ first_qm_id, question_id }` | `start-game` fn |
| `qm:ready` | `{}` | `qm-ready` fn |
| `round:all_answered` | `{}` | `submit-answer` fn |
| `round:results` | `{ results: [{ player_id, is_correct }] }` | `submit-answer` fn |
| `leaderboard:update` | `{ scores: [{ player_id, score }] }` | `next-round` fn |

---

## Edge Functions

### `create-room` — MVP Scope
Called by host after entering display name.

**Input:**
```ts
{ display_name: string }
```

**Logic:**
1. Verify `auth.uid()` is set
2. Upsert a profile row with the display name
3. Generate a random 6-character uppercase alphanumeric code
4. Check code uniqueness (retry if collision)
5. Insert room row with `status: 'lobby'`, `host_id: auth.uid()`
6. Insert room_players row with `is_host: true`
7. Return room code

**Output:**
```ts
{ room_code: string, room_id: string }
```

---

### `join-room` — MVP Scope
Called by joiner after entering room code.

**Input:**
```ts
{ room_code: string, display_name: string }
```

**Logic:**
1. Verify `auth.uid()` is set
2. Upsert profile row with display name
3. Look up room by code
4. Validate room exists and `status === 'lobby'`
5. Insert room_players row with `is_host: false`
6. Return room data

**Output:**
```ts
{ room_id: string, room_code: string }
```

**Errors:**
- `ROOM_NOT_FOUND` — invalid code
- `ROOM_NOT_IN_LOBBY` — game already started

---

### `start-game` — Partner Scope
Called by host from lobby.

**Logic:**
1. Validate caller is host of room
2. Pick first QM — random selection from `room_players` ordered by `joined_at`
3. Draw random `question_id` not in `used_question_ids`
4. Create `rounds` row
5. Update `rooms`: `status → round_start`, `current_round → 1`, `current_qm_id`, append to `used_question_ids`
6. Broadcast `game:started` on `game:{code}`

---

### `submit-answer` — Partner Scope
Called by each answerer when they submit a guess.

**Logic:**
1. Validate caller is not current QM
2. Insert `round_answers` row, compute `is_correct`
3. Check if all non-QM players in room have answered for this round
4. If all answered:
   - Award +1 to `room_players.score` for each correct answer
   - Broadcast `round:results` with per-player correct/wrong
5. If not all answered: return acknowledgement only

---

### `next-round` — Partner Scope
Called after leaderboard is displayed.

**Logic:**
1. Get current player list ordered by `joined_at`
2. Find current QM position in list
3. Advance to next player cyclically
4. Draw new unused `question_id`
5. Create new `rounds` row
6. Update `rooms`: `status → round_start`, increment `current_round`, update `current_qm_id`, append new question to `used_question_ids`
7. Broadcast `leaderboard:update` with current scores and next round signal

---

## QM Rotation Logic

Players are ordered by `joined_at` ascending. The QM cycles through this ordered list indefinitely.

```ts
const players = await getPlayersOrderedByJoinTime(room_id)
const currentIndex = players.findIndex(p => p.player_id === room.current_qm_id)
const nextIndex = (currentIndex + 1) % players.length
const nextQM = players[nextIndex]
```

This ensures every player gets an equal number of turns as QM over time, in a predictable rotation that players can follow.
