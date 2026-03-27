import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized, no auth header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await authClient.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized, user fetch failed', details: authError }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { room_code, display_name } = await req.json()
  const uid = user.id

  await supabase.from('profiles').upsert({ id: uid, display_name })

  const { data: room } = await supabase
    .from('rooms')
    .select('id, code, status, current_qm_id, current_round')
    .ilike('code', room_code)
    .maybeSingle()

  if (!room) {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (room.status === 'closed') {
    return new Response(JSON.stringify({ error: 'ROOM_CLOSED' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const isLateJoin = room.status !== 'lobby'

  // Upsert to handle rejoins gracefully.
  // is_host is intentionally omitted — it is set by create-room and must not be overwritten.
  await supabase.from('room_players').upsert({
    room_id: room.id,
    player_id: uid,
    display_name,
    is_late_join: isLateJoin,
  }, { onConflict: 'room_id,player_id' })

  // Always return the DB-stored code (not user input) to ensure consistent casing
  const canonicalCode = room.code

  if (!isLateJoin) {
    return new Response(JSON.stringify({ room_id: room.id, room_code: canonicalCode, is_late_join: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Late join — fetch round details and player list
  const [{ data: round }, { data: roomPlayers }] = await Promise.all([
    supabase
      .from('rounds')
      .select('id, question_id, visible_question_ids, answer_phase_started_at')
      .eq('room_id', room.id)
      .eq('round_number', room.current_round)
      .maybeSingle(),
    supabase
      .from('room_players')
      .select('player_id, display_name, is_host')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true }),
  ])

  const players = (roomPlayers ?? []).map((p: { player_id: string; display_name: string; is_host: boolean }) => ({
    id: p.player_id,
    displayName: p.display_name,
    isHost: p.is_host,
  }))

  // Resolve the true current phase — the DB status can lag behind the client state machine.
  // Normal answer-phase completion (all players answered without timer expiring) never
  // updates the DB, so room.status stays 'answer_phase' even while the leaderboard is shown.
  let effectiveStatus = room.status

  if (room.status === 'active') {
    // Round 1 immediately after start-game: QM slot machine is running
    effectiveStatus = 'qm_active'
  } else if (room.status === 'answer_phase' && round) {
    // Check whether the round has already completed client-side by counting submitted answers
    const [{ count: answerCount }, { count: answererCount }] = await Promise.all([
      supabase
        .from('round_answers')
        .select('player_id', { count: 'exact', head: true })
        .eq('round_id', round.id),
      supabase
        .from('room_players')
        .select('player_id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .neq('player_id', room.current_qm_id ?? ''),
    ])

    const allAnswered =
      answerCount !== null &&
      answererCount !== null &&
      answererCount > 0 &&
      answerCount >= answererCount

    if (allAnswered) {
      // Round complete — everyone is on or heading to the leaderboard
      effectiveStatus = 'leaderboard'
    }
  } else if (room.status === 'round_results') {
    // The 3.5 s results screen auto-advances; skip it on rejoin and go straight to leaderboard
    effectiveStatus = 'leaderboard'
  }

  return new Response(JSON.stringify({
    room_id: room.id,
    room_code: canonicalCode,
    is_late_join: true,
    current_status: effectiveStatus,
    current_qm_id: room.current_qm_id,
    current_round: room.current_round,
    current_round_id: round?.id ?? null,
    question_id: round?.question_id ?? null,
    visible_question_ids: round?.visible_question_ids ?? [],
    answer_phase_started_at: round?.answer_phase_started_at ?? null,
    players,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
