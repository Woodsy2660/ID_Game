-- ─────────────────────────────────────────────────────────────────────────────
-- 0000_baseline.sql
-- Documents the schema that was previously created ad-hoc in the Supabase
-- dashboard. Written with IF NOT EXISTS so it is safe to run against the
-- existing production database (it will no-op where objects already exist).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references profiles(id) on delete cascade,
  status text default 'lobby',
  current_round int default 0,
  current_qm_id uuid references profiles(id),
  used_question_ids int[] default '{}',
  created_at timestamptz default now()
);

create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  player_id uuid references profiles(id) on delete cascade,
  display_name text not null,
  score int default 0,
  is_host bool default false,
  is_late_join bool default false,
  is_kicked bool default false,
  joined_at timestamptz default now(),
  unique (room_id, player_id)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round_number int not null,
  qm_id uuid references profiles(id),
  question_id int not null,
  visible_question_ids int[] default '{}',
  answer_phase_started_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists round_answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references profiles(id) on delete cascade,
  guessed_question_id int not null,
  is_correct bool,
  submitted_at timestamptz default now(),
  unique (round_id, player_id)
);

create table if not exists kick_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round_id uuid references rounds(id) on delete cascade,
  target_player_id uuid references profiles(id) on delete cascade,
  voter_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (round_id, target_player_id, voter_id)
);

-- Atomic score increment used by expire-round / result scoring.
create or replace function increment_player_score(p_room_id uuid, p_player_id uuid)
returns void
language sql
as $$
  update room_players
     set score = score + 1
   where room_id = p_room_id
     and player_id = p_player_id;
$$;
