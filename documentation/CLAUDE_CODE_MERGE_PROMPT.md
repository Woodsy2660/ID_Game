# Claude Code Task — Merge Partner Branch + Apply Phase 2 Changes

## Context

This repo has two sets of changes that need to be layered in the correct order:

1. **Partner branch** (`ty-question-and-answer-flow`) — major UI/UX changes to the question and answer flow. These must be merged first and treated as the new baseline.
2. **Phase 2 feature changes** — the backend and client changes listed at the bottom of this prompt. These get applied on top of the merged partner code.

Do not start on Phase 2 until the merge is complete and confirmed clean.

---

## Step 1 — Stash or Reset Current Working Changes

Before touching anything, check the current state of the working tree:

```bash
git status
```

If there are uncommitted changes from the Phase 2 implementation that was previously attempted, stash them so they are not lost:

```bash
git stash push -m "phase-2-changes-pre-merge"
```

Confirm the working tree is clean before proceeding:

```bash
git status
# Should show: nothing to commit, working tree clean
```

---

## Step 2 — Fetch the Partner Branch

Fetch all remote branches to make sure the partner's branch is available locally:

```bash
git fetch origin
git branch -a | grep ty-question-and-answer-flow
```

If the branch appears in the remote list, check it out:

```bash
git checkout -b ty-question-and-answer-flow origin/ty-question-and-answer-flow
```

Review what changed in the partner branch before merging:

```bash
git log --oneline origin/main..ty-question-and-answer-flow
git diff origin/main...ty-question-and-answer-flow --stat
```

Read the diff output carefully. Note every file that was changed. This is the baseline you will be layering Phase 2 on top of.

---

## Step 3 — Merge Partner Branch into Current Branch

Switch back to your working branch (likely `main` or `dev`):

```bash
git checkout main
```

Merge the partner branch:

```bash
git merge ty-question-and-answer-flow --no-ff -m "merge: ty-question-and-answer-flow UI/UX changes"
```

**If merge conflicts occur:**
- Resolve all conflicts manually
- Prioritise the partner's UI/UX changes for any screen files they touched
- Do not auto-resolve with `git merge -X ours` or `git merge -X theirs` — read each conflict
- After resolving: `git add .` then `git merge --continue`

Confirm the merge is clean:

```bash
git status
git log --oneline -5
```

---

## Step 4 — Verify the App Still Runs After Merge

Before applying any Phase 2 changes, verify the merged codebase works:

```bash
npx expo start
```

Check for:
- No TypeScript errors on startup
- No import errors from the partner's new files
- Navigation still works from home → create/join → lobby
- Partner's question and answer screens render correctly

Fix any broken imports or type errors from the merge before continuing. Do not proceed to Phase 2 if the app is broken at this point.

---

## Step 5 — Apply Phase 2 Changes on Top

Once the merge is confirmed clean and the app runs, restore the Phase 2 stash:

```bash
git stash pop
```

Review what the stash contains before applying:

```bash
git diff --stat
```

Go through each changed file and verify it does not conflict with the partner's newly merged code. Pay special attention to:

- Any screen files the partner modified that Phase 2 also touches (answer screen, leaderboard screen, lobby screen)
- The game broadcast channel subscription — the partner may have restructured `useGame` or the game shell layout
- The player store — check if the partner added any fields that Phase 2 also adds

For each conflict between the stash and the merged partner code:
- Keep the partner's UI/UX structure and component layout
- Layer the Phase 2 logic (timer, kick votes, late join handling, exit button) on top of it
- Do not overwrite the partner's screen components — add to them

---

## Step 6 — Re-apply Phase 2 Changes Cleanly

Work through each Phase 2 task in order. For each task, check whether the partner's code already partially implements it or conflicts with it before writing any code.

### Database changes (run in Supabase SQL editor — do not skip)

```sql
alter table rounds add column if not exists answer_phase_started_at timestamptz;
alter table room_players add column if not exists is_kicked bool default false;
alter table room_players add column if not exists is_late_join bool default false;

create table if not exists kick_votes (
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

Add `kick_votes` to the `supabase_realtime` publication in the Supabase dashboard.

### Edge functions to write or update

Work through these in order. For each one, read the existing function code first before modifying:

1. `supabase/functions/end-game/index.ts` — new function
2. `supabase/functions/join-room/index.ts` — update existing (late join logic)
3. `supabase/functions/leave-room/index.ts` — new function
4. `supabase/functions/vote-kick/index.ts` — new function
5. `supabase/functions/expire-round/index.ts` — new function

### Client changes — apply to partner's existing screens

For each screen the partner modified, read their full component before adding Phase 2 logic:

**Leaderboard screen:**
- Read the partner's full leaderboard component first
- Add "End Game" button for host below the existing scores UI
- Do not restructure the partner's layout

**Answer screen:**
- Read the partner's full answer component first
- Add `CountdownTimer` component below or above the existing answer UI
- Add vote-to-kick flag icon next to player names in whatever player list the partner renders
- Do not restructure the partner's layout

**Game shell layout / broadcast channel:**
- Find where the partner subscribes to the broadcast channel
- Add `game:ended`, `player:kicked`, `kick:vote_update` listeners to the existing subscription
- Do not create a duplicate channel subscription

**Lobby screen:**
- Find the partner's lobby or confirm it was not modified
- Add late join navigation logic after `join-room` returns

### New files to create (these should not conflict)

- `src/components/CountdownTimer.tsx`
- `src/components/RejoinPrompt.tsx`
- `app/(game)/waiting.tsx`

### Player store persistence

Update `src/stores/playerStore.ts` with Zustand persist middleware. Read the partner's version of this file first — if they added new fields, include them in the persisted state shape.

---

## Step 7 — Deploy Edge Functions

After all functions are written and verified locally:

```bash
supabase functions deploy end-game --no-verify-jwt
supabase functions deploy join-room --no-verify-jwt
supabase functions deploy leave-room --no-verify-jwt
supabase functions deploy vote-kick --no-verify-jwt
supabase functions deploy expire-round --no-verify-jwt
```

---

## Step 8 — Commit

Once everything runs cleanly:

```bash
git add .
git commit -m "feat: phase 2 — exit game, late join, crash recovery, vote kick, answer timer"
```

---

## Constraints

- **Never overwrite the partner's UI components** — add to them, don't replace them
- **Read before writing** — for every file you touch, read the full current content first
- **Merge before Phase 2** — if the merge is not clean, stop and report the conflicts before continuing
- **One thing at a time** — complete and verify each step before moving to the next
- **If the stash pop causes conflicts** — resolve them file by file, preserving partner UI and layering Phase 2 logic on top
