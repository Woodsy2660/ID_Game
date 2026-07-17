-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_rls.sql
-- Row Level Security. Game-state writes (rooms, rounds, room membership changes,
-- scoring, forfeits, leaving) go through Edge Functions using the service role,
-- which bypasses RLS. These policies govern what an anonymous player's own JWT
-- may do directly, and are deliberately least-privilege.
--
-- Privacy stance:
--   * A player may read only rooms/rounds/players for rooms they belong to.
--   * A player may read only their OWN answers (guesses are not exposed to peers
--     before results). The live "answers in" tally uses count_round_answers()
--     below, which returns a bare integer, not other players' guesses.
--   * A player may insert an answer only into their own room, only for a pack
--     they are allowed to play (mature packs require a recorded 18+ confirmation).
-- ─────────────────────────────────────────────────────────────────────────────

alter table profiles       enable row level security;
alter table rooms          enable row level security;
alter table room_players   enable row level security;
alter table rounds         enable row level security;
alter table round_answers  enable row level security;
alter table kick_votes     enable row level security;

-- Helper: is the current user a (non-kicked) member of this room?
-- SECURITY DEFINER so it can read room_players without recursing into RLS.
create or replace function is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from room_players
     where room_id = p_room_id
       and player_id = auth.uid()
       and is_kicked = false
  );
$$;

-- Helper: has the current user completed the 18+ confirmation for this room?
create or replace function has_pack_consent(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
      from room_players rp
      join rooms rm on rm.id = rp.room_id
     where rp.room_id = p_room_id
       and rp.player_id = auth.uid()
       and (rm.pack <> 'infamous' or rp.adult_confirmed_at is not null)
  );
$$;

-- ── profiles ────────────────────────────────────────────────────────────────
drop policy if exists "profiles: owner rw" on profiles;
create policy "profiles: owner rw" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── rooms ───────────────────────────────────────────────────────────────────
-- Members only. Code lookups for joining happen server-side (join-room).
drop policy if exists "rooms: anyone can read" on rooms;
drop policy if exists "rooms: members read" on rooms;
create policy "rooms: members read" on rooms
  for select using (is_room_member(id));

-- ── room_players ────────────────────────────────────────────────────────────
drop policy if exists "room_players: anyone can read" on room_players;
drop policy if exists "room_players: members read" on room_players;
create policy "room_players: members read" on room_players
  for select using (is_room_member(room_id));

-- Direct self-insert is retained for legacy paths, but membership is normally
-- created by create-room / join-room (service role) so consent can be enforced.
drop policy if exists "room_players: player can insert themselves" on room_players;
drop policy if exists "room_players: self insert" on room_players;
create policy "room_players: self insert" on room_players
  for insert with check (auth.uid() = player_id);

-- ── rounds ──────────────────────────────────────────────────────────────────
drop policy if exists "rounds: anyone can read" on rounds;
drop policy if exists "rounds: members read" on rounds;
create policy "rounds: members read" on rounds
  for select using (is_room_member(room_id));

-- ── round_answers ─────────────────────────────────────────────────────────
-- Read own only. Peers never see each other's guesses directly.
drop policy if exists "round_answers: player can read own" on round_answers;
drop policy if exists "round_answers: read own" on round_answers;
create policy "round_answers: read own" on round_answers
  for select using (auth.uid() = player_id);

-- Insert own guess, only into a round in a room you belong to, and only if you
-- have the required pack consent (blocks any client that skipped the 18+ gate).
drop policy if exists "round_answers: player can insert own" on round_answers;
drop policy if exists "round_answers: self insert with consent" on round_answers;
create policy "round_answers: self insert with consent" on round_answers
  for insert with check (
    auth.uid() = player_id
    and exists (
      select 1
        from rounds r
        join room_players rp on rp.room_id = r.room_id and rp.player_id = auth.uid()
        join rooms rm on rm.id = r.room_id
       where r.id = round_id
         and rp.is_kicked = false
         and (rm.pack <> 'infamous' or rp.adult_confirmed_at is not null)
    )
  );

-- ── kick_votes ──────────────────────────────────────────────────────────────
drop policy if exists "kick_votes: members read" on kick_votes;
create policy "kick_votes: members read" on kick_votes
  for select using (is_room_member(room_id));

-- Live "answers in" count without exposing peers' guesses. Members only.
create or replace function count_round_answers(p_round_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
    from round_answers ra
    join rounds r on r.id = ra.round_id
   where ra.round_id = p_round_id
     and is_room_member(r.room_id);
$$;
