# Phase 1 — Claude Code Task List

## Before You Begin — Required from Developer

You must provide the following values before any task can run. These come from your Supabase project dashboard.

### Supabase Credentials

Go to your Supabase project → Settings → API

| Variable | Where to find it | Used for |
|----------|-----------------|---------|
| `SUPABASE_URL` | Settings → API → Project URL | Supabase client init |
| `SUPABASE_ANON_KEY` | Settings → API → Project API keys → `anon public` | Supabase client init (safe to expose in app) |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API keys → `service_role secret` | Edge functions only — never put this in the app |

### Where Each Key Goes

```
# App root — create this file, never commit it
.env.local
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# Supabase Edge Functions environment — set via Supabase dashboard
# Dashboard → Edge Functions → Manage secrets
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

Add `.env.local` to `.gitignore` immediately.

---

## Task 1 — Supabase Database Setup

**Run the following SQL in Supabase → SQL Editor in this exact order.**

### 1a. Create Tables

```sql
-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

-- Rooms
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

-- Room Players
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

-- Rounds (partner scope — create now so schema is complete)
create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round_number int not null,
  qm_id uuid references profiles(id),
  question_id int not null,
  created_at timestamptz default now()
);

-- Round Answers (partner scope — create now so schema is complete)
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

### 1b. Enable Row Level Security

```sql
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_players enable row level security;
alter table rounds enable row level security;
alter table round_answers enable row level security;
```

### 1c. Create RLS Policies

```sql
-- Profiles
create policy "profiles: owner all"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Rooms
create policy "rooms: anyone can read"
  on rooms for select using (true);

create policy "rooms: host can insert"
  on rooms for insert
  with check (auth.uid() = host_id);

-- Room Players
create policy "room_players: anyone can read"
  on room_players for select using (true);

create policy "room_players: player inserts self"
  on room_players for insert
  with check (auth.uid() = player_id);

-- Rounds
create policy "rounds: anyone can read"
  on rounds for select using (true);

-- Round Answers
create policy "round_answers: player reads own"
  on round_answers for select
  using (auth.uid() = player_id);

create policy "round_answers: player inserts own"
  on round_answers for insert
  with check (auth.uid() = player_id);
```

### 1d. Enable Realtime

In Supabase Dashboard:
1. Go to Database → Replication
2. Find `room_players` in the table list
3. Toggle it on

### 1e. Enable Anonymous Auth

In Supabase Dashboard:
1. Go to Authentication → Providers
2. Find "Anonymous" provider
3. Enable it and save

**Verify:** All 5 tables appear in the Table Editor with the lock icon showing RLS is active.

---

## Task 2 — Install Dependencies

In the Expo project root, run:

```bash
npx expo install @supabase/supabase-js
npx expo install expo-secure-store
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler
npx expo install zustand
```

Also install the Supabase CLI globally if not already installed:

```bash
npm install -g supabase
```

Then link it to your project:

```bash
supabase login
supabase link --project-ref your-project-ref
```

Your project ref is in Supabase → Settings → General → Reference ID.

---

## Task 3 — Project Structure Setup

Create the following empty files and folders so the import paths resolve correctly before writing any code:

```
src/
  lib/
    supabase.ts
  hooks/
    useAuth.ts
    useRoom.ts
  stores/
    playerStore.ts
  components/
    PlayerList.tsx
    RoomCode.tsx
    Button.tsx
  constants/
    config.ts
    questions.json

app/
  _layout.tsx
  (auth)/
    index.tsx
  (game)/
    _layout.tsx
    create.tsx
    join.tsx
    lobby.tsx

supabase/
  functions/
    create-room/
      index.ts
    join-room/
      index.ts

.env.local
```

---

## Task 4 — Supabase Client and Config

### 4a. Create `src/constants/config.ts`

Read values from environment variables:

```ts
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
```

### 4b. Create `src/lib/supabase.ts`

- Import `createClient` from `@supabase/supabase-js`
- Import `expo-secure-store` for session persistence
- Create a `SecureStoreAdapter` object with `getItem`, `setItem`, `removeItem` methods that wrap the SecureStore async methods
- Initialise the Supabase client with:
  - `auth.storage`: the SecureStoreAdapter
  - `auth.autoRefreshToken`: true
  - `auth.persistSession`: true
  - `auth.detectSessionInUrl`: false
- Export the client as `supabase`

---

## Task 5 — Auth Hook

### Create `src/hooks/useAuth.ts`

This hook manages the anonymous auth session.

**Responsibilities:**
- On mount, check if a session already exists via `supabase.auth.getSession()`
- If no session exists, call `supabase.auth.signInAnonymously()`
- Expose: `session`, `user`, `loading` as return values
- Expose: `setDisplayName(name: string)` function that upserts to the `profiles` table using `auth.uid()` as the id
- Listen to `supabase.auth.onAuthStateChange` and update state accordingly

**TypeScript shape:**
```ts
interface UseAuthReturn {
  session: Session | null
  user: User | null
  loading: boolean
  setDisplayName: (name: string) => Promise<void>
}
```

---

## Task 6 — Player Store

### Create `src/stores/playerStore.ts`

Use Zustand to create a global store for the current player's session state.

**Store shape:**
```ts
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
```

**Actions:**
- `setPlayer` — called after auth and display name are confirmed
- `setRoom` — called after create-room or join-room succeeds
- `clearRoom` — called when player leaves lobby
- `reset` — full reset on session end

---

## Task 7 — Root Layout

### Create `app/_layout.tsx`

- Wrap the app in `<SafeAreaProvider>`
- Initialise auth by calling `useAuth` at the top level
- If `loading` is true, render a loading spinner
- If `session` is null after loading, keep user on the auth screen
- Use Expo Router's `<Stack>` navigator
- Pass auth context down via React Context so all screens can access `user` and `setDisplayName`

---

## Task 8 — Home Screen

### Create `app/(auth)/index.tsx`

This is the first screen every player sees.

**UI elements:**
- App name / logo placeholder
- Text input: "Enter your name" (max 20 characters)
- Button: "Create Room" — disabled until name is entered
- Button: "Join Room" — disabled until name is entered

**On "Create Room" tap:**
1. Call `setDisplayName(name)` from useAuth
2. Call `setPlayer(user.id, name)` on the player store
3. Navigate to `/create`

**On "Join Room" tap:**
1. Call `setDisplayName(name)` from useAuth
2. Call `setPlayer(user.id, name)` on the player store
3. Navigate to `/join`

**Validation:**
- Name must be at least 2 characters
- Strip leading/trailing whitespace before saving

---

## Task 9 — Create Room Edge Function

### Create `supabase/functions/create-room/index.ts`

This runs server-side. Use the Supabase service role client inside the function.

**Input (JSON body):**
```ts
{ display_name: string }
```

**Logic — in this order:**
1. Parse the JWT from the `Authorization` header to get `auth.uid()`
2. Return 401 if no valid JWT
3. Upsert to `profiles` table: `{ id: uid, display_name }`
4. Generate a random 6-character uppercase code (A-Z, 0-9)
5. Check the `rooms` table for code uniqueness — retry up to 5 times if collision
6. Insert to `rooms`: `{ code, host_id: uid, status: 'lobby' }`
7. Insert to `room_players`: `{ room_id, player_id: uid, display_name, is_host: true }`
8. Return `{ room_id, room_code: code }`

**Error responses:**
- 401: not authenticated
- 500: failed after 5 code generation attempts

**Deploy command (run after writing):**
```bash
supabase functions deploy create-room
```

---

## Task 10 — Create Room Screen

### Create `app/(game)/create.tsx`

**On mount:**
- Call `supabase.functions.invoke('create-room', { body: { display_name } })`
- Show a loading state while the function runs
- On success: call `setRoom(room_id, room_code, true)` on player store, then navigate to `/lobby`
- On error: show error message with retry button

**UI elements:**
- Loading state: spinner + "Creating your room..."
- Success (brief): large room code display before navigation
- Error state: message + "Try again" button

**Room code display:**
- Show code in large, spaced letters (e.g. "A B C 1 2 3")
- "Share with your group" subtext
- This screen auto-navigates to lobby after 1.5 seconds on success so players can see the code

---

## Task 11 — Join Room Edge Function

### Create `supabase/functions/join-room/index.ts`

**Input (JSON body):**
```ts
{ room_code: string, display_name: string }
```

**Logic — in this order:**
1. Parse JWT from `Authorization` header
2. Return 401 if no valid JWT
3. Upsert to `profiles`: `{ id: uid, display_name }`
4. Look up `rooms` where `code = room_code` (case-insensitive)
5. If not found: return 404 with `{ error: 'ROOM_NOT_FOUND' }`
6. If room `status !== 'lobby'`: return 409 with `{ error: 'ROOM_NOT_IN_LOBBY' }`
7. Insert to `room_players`: `{ room_id, player_id: uid, display_name, is_host: false }`
8. Return `{ room_id, room_code }`

**Deploy command:**
```bash
supabase functions deploy join-room
```

---

## Task 12 — Join Room Screen

### Create `app/(game)/join.tsx`

**UI elements:**
- Text input: "Enter room code" — 6 characters max, auto-capitalise
- Button: "Join" — disabled until exactly 6 characters entered
- Error message area (hidden until error occurs)

**On "Join" tap:**
1. Call `supabase.functions.invoke('join-room', { body: { room_code, display_name } })`
2. Show loading state on button
3. On success: call `setRoom(room_id, room_code, false)` on player store, navigate to `/lobby`
4. On `ROOM_NOT_FOUND`: show "Room not found. Check the code and try again."
5. On `ROOM_NOT_IN_LOBBY`: show "This game has already started."
6. On other error: show "Something went wrong. Try again."

**UX notes:**
- Auto-focus the input on mount
- On mobile, show numeric + alpha keyboard
- Auto-submit when 6th character is entered

---

## Task 13 — Room Hook

### Create `src/hooks/useRoom.ts`

This hook manages all realtime connections for the lobby.

**Responsibilities:**
- Accept `room_code` and `player_id` as parameters
- On mount: subscribe to presence channel `room:{room_code}`
- Call `channel.track({ player_id, display_name })` to register presence
- On `presence sync`: extract player list from presence state and return it
- On mount: subscribe to broadcast channel `game:{room_code}`
- On `game:started` broadcast: call a provided `onGameStart` callback
- On unmount: unsubscribe from both channels

**TypeScript shape:**
```ts
interface UseRoomReturn {
  players: { player_id: string; display_name: string }[]
  isConnected: boolean
}

function useRoom(
  room_code: string,
  player_id: string,
  display_name: string,
  onGameStart: () => void
): UseRoomReturn
```

---

## Task 14 — Player List Component

### Create `src/components/PlayerList.tsx`

**Props:**
```ts
interface PlayerListProps {
  players: { player_id: string; display_name: string }[]
  currentPlayerId: string
}
```

**UI:**
- Renders a scrollable list of player names
- Highlights the current player's own name
- Shows a small indicator next to the host (you can pass host_id as a prop)
- Shows player count: "4 players"
- Empty state: "Waiting for players to join..."

---

## Task 15 — Lobby Screen

### Create `app/(game)/lobby.tsx`

This is the most important screen in Phase 1. It ties everything together.

**On mount:**
1. Read `room_id`, `room_code`, `is_host`, `player_id`, `display_name` from player store
2. Call `useRoom(room_code, player_id, display_name, handleGameStart)`
3. Subscribe presence and broadcast

**Host UI:**
- Room code displayed at top (smaller than create screen, but visible)
- "Share this code with your friends" label
- `<PlayerList>` component with live player list
- "Start Game" button — enabled when player count ≥ 2
- On "Start Game" tap: call `supabase.functions.invoke('start-game', ...)` — this is the hand-off to partner code

**Joiner UI:**
- Same room code display
- Same `<PlayerList>` component
- "Waiting for host to start..." message instead of button

**`handleGameStart` function:**
```ts
const handleGameStart = () => {
  router.push('/game/round') // partner's screen
}
```

**On unmount:**
- Call `clearRoom()` on player store if navigating back (not forward to game)

---

## Task 16 — Game Shell Layout

### Create `app/(game)/_layout.tsx`

- Wrap game screens in `<GestureHandlerRootView>`
- Disable the back gesture/button during the game (prevent accidental exit)
- Pass room context from player store to all child screens via context or props

---

## Task 17 — Smoke Test Checklist

Run through this manually on two devices (or browser tabs) before handing off:

- [ ] App launches and signs in anonymously without any user action
- [ ] Entering a name and tapping "Create Room" calls the edge function
- [ ] Room code appears on screen
- [ ] Second device can join using the code
- [ ] Both devices show each other's names in the lobby in real time
- [ ] A third device joining also appears on all lobby screens
- [ ] Host sees "Start Game" button, joiner does not
- [ ] "Start Game" button is disabled with only 1 player
- [ ] Closing the joiner tab removes them from the lobby player list
- [ ] Edge function returns correct error when joining with invalid code
- [ ] Edge function returns correct error when joining a started game

---

## Hand-off to Partner

Once Task 17 passes, the partner build can begin. Point your partner to `PARTNER_HANDOFF.md`.

The partner needs:
- The same Supabase project credentials
- Read access to this repo
- The `SUPABASE_SERVICE_ROLE_KEY` for their edge functions
- Confirmation of the `game:started` broadcast event shape

The partner's entry route is `/game/round` — ensure this file exists as a placeholder so navigation does not throw before their code is connected.
