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

const IN_ROUND = new Set(['active', 'round_start', 'qm_active', 'answer_phase'])

/**
 * forfeit-turn — the current Question Master voluntarily skips their turn.
 *
 * There is deliberately no reroll. Forfeiting:
 *   - awards no points,
 *   - cancels the active answer timer and any in-flight submissions,
 *   - marks the round forfeited,
 *   - advances everyone to the leaderboard (→ next QM on the next round).
 *
 * Only the current QM may call this.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { room_id } = await req.json()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, code, status, current_qm_id, current_round')
    .eq('id', room_id)
    .maybeSingle()

  if (!room) return json({ error: 'ROOM_NOT_FOUND' }, 404)
  if (room.current_qm_id !== user.id) return json({ error: 'NOT_QM' }, 403)
  if (!IN_ROUND.has(room.status)) {
    // Already past the point where a turn can be forfeited — idempotent no-op.
    return json({ ok: true, alreadyAdvanced: true })
  }

  // Mark the round forfeited and cancel its timer so a late expire-round no-ops.
  await supabase
    .from('rounds')
    .update({ forfeited: true, answer_phase_started_at: null })
    .eq('room_id', room_id)
    .eq('round_number', room.current_round)

  await supabase
    .from('rooms')
    .update({ status: 'round_results', last_active_at: new Date().toISOString() })
    .eq('id', room_id)

  const channel = supabase.channel(`game:${room.code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'round:forfeited',
          payload: { reason: 'qm_forfeit' },
        })
        await supabase.removeChannel(channel)
        resolve()
      }
    })
  })

  return json({ ok: true })
})
