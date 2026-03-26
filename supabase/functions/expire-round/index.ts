import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIMER_SECONDS = 180

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { room_id, round_id } = await req.json()

  // Fetch round to verify timer has actually expired
  const { data: round } = await supabase
    .from('rounds')
    .select('id, question_id, qm_id, answer_phase_started_at')
    .eq('id', round_id)
    .single()

  if (!round || !round.answer_phase_started_at) {
    return new Response(JSON.stringify({ expired: false, reason: 'no_timer' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const startedAt = new Date(round.answer_phase_started_at).getTime()
  const elapsedMs = Date.now() - startedAt
  if (elapsedMs < TIMER_SECONDS * 1000) {
    return new Response(JSON.stringify({ expired: false, reason: 'not_yet' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch room to check status and get room code
  const { data: room } = await supabase
    .from('rooms')
    .select('code, status, current_qm_id')
    .eq('id', room_id)
    .single()

  if (!room || room.status !== 'answer_phase') {
    // Already advanced — idempotent early return
    return new Response(JSON.stringify({ expired: false, reason: 'already_advanced' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch all active players (not kicked, excluding QM)
  const { data: allPlayers } = await supabase
    .from('room_players')
    .select('player_id, display_name, score, is_kicked, is_late_join, joined_at')
    .eq('room_id', room_id)

  if (!allPlayers) {
    return new Response(JSON.stringify({ error: 'PLAYERS_NOT_FOUND' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Eligible answerers: not QM, not kicked, not late joiners who arrived after phase started
  const eligiblePlayers = allPlayers.filter((p) => {
    if (p.player_id === room.current_qm_id) return false
    if (p.is_kicked) return false
    if (p.is_late_join && p.joined_at) {
      const joinedAfterPhase = new Date(p.joined_at).getTime() >= startedAt
      if (joinedAfterPhase) return false
    }
    return true
  })

  // Find who hasn't answered yet
  const { data: existingAnswers } = await supabase
    .from('round_answers')
    .select('player_id')
    .eq('round_id', round_id)

  const answeredIds = new Set((existingAnswers ?? []).map((a: { player_id: string }) => a.player_id))
  const unansweredPlayers = eligiblePlayers.filter((p) => !answeredIds.has(p.player_id))

  // Insert placeholder answers (is_correct: false) for all unanswered players
  if (unansweredPlayers.length > 0) {
    await supabase.from('round_answers').insert(
      unansweredPlayers.map((p) => ({
        round_id,
        player_id: p.player_id,
        guessed_question_id: -1,
        is_correct: false,
      }))
    )
  }

  // Fetch final answers to compute scores
  const { data: allAnswers } = await supabase
    .from('round_answers')
    .select('player_id, is_correct')
    .eq('round_id', round_id)

  // Update scores for correct answers
  const scoreUpdates: Promise<unknown>[] = []
  for (const answer of allAnswers ?? []) {
    if (answer.is_correct) {
      scoreUpdates.push(
        supabase.rpc('increment_player_score', {
          p_room_id: room_id,
          p_player_id: answer.player_id,
        })
      )
    }
  }
  await Promise.all(scoreUpdates)

  // Advance room to round_results
  await supabase
    .from('rooms')
    .update({ status: 'round_results' })
    .eq('id', room_id)

  // Build results payload
  const results = (allAnswers ?? []).map((a: { player_id: string; is_correct: boolean }) => ({
    player_id: a.player_id,
    is_correct: a.is_correct,
  }))

  // Broadcast round:results
  const channel = supabase.channel(`game:${room.code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'round:results',
          payload: { results, expired: true },
        })
        await supabase.removeChannel(channel)
        resolve()
      }
    })
  })

  return new Response(JSON.stringify({ expired: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
