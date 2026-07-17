-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_retention.sql
-- Temporary-data retention. Rooms and everything hanging off them (players,
-- rounds, answers, scores, 18+ confirmations, kick votes) are deleted once the
-- game has ended or the room has been inactive for 24 hours. All child tables
-- reference rooms with ON DELETE CASCADE, so deleting the room removes the lot.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function delete_stale_rooms()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted int;
begin
  with removed as (
    delete from rooms
     where status = 'closed'
        or coalesce(last_active_at, created_at) < now() - interval '24 hours'
    returning id
  )
  select count(*) into deleted from removed;
  return deleted;
end;
$$;

-- Orphan profiles: anonymous auth users accumulate a profile row on first sign
-- in. Once a profile is no longer referenced by any room membership and is older
-- than 24h, it is temporary residue — remove it too.
create or replace function delete_orphan_profiles()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted int;
begin
  with removed as (
    delete from profiles p
     where p.created_at < now() - interval '24 hours'
       and not exists (select 1 from room_players rp where rp.player_id = p.id)
    returning id
  )
  select count(*) into deleted from removed;
  return deleted;
end;
$$;

-- Schedule hourly. Requires the pg_cron extension (Supabase: Database →
-- Extensions → enable "pg_cron"). If pg_cron is unavailable, invoke
-- delete_stale_rooms() from a scheduled Edge Function / external cron instead.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('id-game-retention')
      where exists (select 1 from cron.job where jobname = 'id-game-retention');
    perform cron.schedule(
      'id-game-retention',
      '7 * * * *',
      $cron$ select delete_stale_rooms(); select delete_orphan_profiles(); $cron$
    );
  else
    raise notice 'pg_cron not installed — enable it and re-run, or call delete_stale_rooms() from an external scheduler.';
  end if;
end $$;
