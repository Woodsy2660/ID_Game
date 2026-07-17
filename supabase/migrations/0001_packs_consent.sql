-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_packs_consent.sql
-- Adds question packs, the mature-pack (18+) confirmation record, per-round
-- forfeit tracking, and a last-active timestamp used by retention.
-- ─────────────────────────────────────────────────────────────────────────────

-- Every room is locked to one pack for its whole life.
-- 'boys' | 'girls' | 'infamous'. Default 'boys' so existing rows stay valid;
-- create-room always sets an explicit, validated pack.
alter table rooms
  add column if not exists pack text not null default 'boys',
  add column if not exists last_active_at timestamptz default now();

alter table rooms
  drop constraint if exists rooms_pack_check;
alter table rooms
  add constraint rooms_pack_check check (pack in ('boys', 'girls', 'infamous'));

-- Mature-pack confirmation. We store ONLY the fact of confirmation, when it was
-- given, and which warning version was shown — never a date of birth or any
-- identity document. Null = not confirmed.
alter table room_players
  add column if not exists adult_confirmed_at timestamptz,
  add column if not exists adult_confirmed_version text;

-- Marks a round whose Question Master forfeited (or left mid-turn): no points
-- were awarded and the turn was skipped.
alter table rounds
  add column if not exists forfeited boolean not null default false;

-- Keep last_active_at fresh as the room progresses (used by retention sweep).
create or replace function touch_room_activity(p_room_id uuid)
returns void
language sql
as $$
  update rooms set last_active_at = now() where id = p_room_id;
$$;
