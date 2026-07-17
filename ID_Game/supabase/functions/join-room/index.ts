import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized, no auth header' }, 401)

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) return json({ error: 'Unauthorized, user fetch failed' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { room_code, display_name, adult_confirmed, adult_warning_version } = await req.json()
  const uid = user.id

  await supabase.from('profiles').upsert({ id: uid, display_name })

  const { data: room } = await supabase
    .from('rooms')
    .select('id, code, status, current_qm_id, current_round, pack')
    .ilike('code', room_code)
    .maybeSingle()

  if (!room) return json({ error: 'ROOM_NOT_FOUND' }, 404)
  if (room.status === 'closed') return json({ error: 'ROOM_CLOSED' }, 409)

  const isMature = room.pack === 'infamous'

  // Existing membership (rejoin) — used to see if consent is already on file.
  const { data: existing } = await supabase
    .from('room_players')
    .select('adult_confirmed_at')
    .eq('room_id', room.id)
    .eq('player_id', uid)
    .maybeSingle()

  const alreadyConfirmed = !!existing?.adult_confirmed_at

  // ── Mature-pack gate: block entry until this player confirms 18+. ───────────
  // Enforced here so it cannot be bypassed via a direct join, a late join, a
  // rejoin, or restored local state — the server refuses to grant/confirm
  // membership without a recorded confirmation.
  if (isMature && !alreadyConfirmed && adult_confirmed !== true) {
    return json({ error: 'ADULT_CONFIRMATION_REQUIRED', pack: room.pack }, 403)
  }

  const consentPatch =
    isMature && !alreadyConfirmed
      ? {
          adult_confirmed_at: new Date().toISOString(),
          adult_confirmed_version: String(adult_warning_version ?? ''),
        }
      : {}

  const isLateJoin = room.status !== 'lobby'

  // is_host intentionally omitted — set by create-room and never overwritten.
  await supabase.from('room_players').upsert(
    {
      room_id: room.id,
      player_id: uid,
      display_name,
      is_late_join: isLateJoin,
      ...consentPatch,
    },
    { onConflict: 'room_id,player_id' }
  )

  await supabase.rpc('touch_room_activity', { p_room_id: room.id })

  const canonicalCode = room.code

  if (!isLateJoin) {
    return json({
      room_id: room.id,
      room_code: canonicalCode,
      pack: room.pack,
      adult_confirmed: isMature ? true : false,
      is_late_join: false,
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
      .eq('is_kicked', false)
      .order('joined_at', { ascending: true }),
  ])

  const players = (roomPlayers ?? []).map(
    (p: { player_id: string; display_name: string; is_host: boolean }) => ({
      id: p.player_id,
      displayName: p.display_name,
      isHost: p.is_host,
    })
  )

  let effectiveStatus = room.status
  if (room.status === 'active') {
    effectiveStatus = 'qm_active'
  } else if (room.status === 'answer_phase' && round) {
    const [{ count: answerCount }, { count: answererCount }] = await Promise.all([
      supabase
        .from('round_answers')
        .select('player_id', { count: 'exact', head: true })
        .eq('round_id', round.id),
      supabase
        .from('room_players')
        .select('player_id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .eq('is_kicked', false)
        .neq('player_id', room.current_qm_id ?? ''),
    ])
    const allAnswered =
      answerCount !== null &&
      answererCount !== null &&
      answererCount > 0 &&
      answerCount >= answererCount
    if (allAnswered) effectiveStatus = 'leaderboard'
  } else if (room.status === 'round_results') {
    effectiveStatus = 'leaderboard'
  }

  return json({
    room_id: room.id,
    room_code: canonicalCode,
    pack: room.pack,
    adult_confirmed: isMature ? true : false,
    is_late_join: true,
    current_status: effectiveStatus,
    current_qm_id: room.current_qm_id,
    current_round: room.current_round,
    current_round_id: round?.id ?? null,
    question_id: round?.question_id ?? null,
    visible_question_ids: round?.visible_question_ids ?? [],
    answer_phase_started_at: round?.answer_phase_started_at ?? null,
    players,
  })
})
