import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

// Send one or more broadcast events on a room channel, then tear it down.
async function broadcast(
  supabase: SupabaseClient,
  code: string,
  events: { event: string; payload: unknown }[]
) {
  const channel = supabase.channel(`game:${code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        for (const e of events) {
          await channel.send({ type: 'broadcast', event: e.event, payload: e.payload })
        }
        await supabase.removeChannel(channel)
        resolve()
      }
    })
  })
}

const IN_ROUND = new Set(['active', 'round_start', 'qm_active', 'answer_phase'])

/**
 * Universal leave handler. A player can call this from any lobby or game screen.
 *
 * Effects:
 *   - Removes the player from the room.
 *   - Broadcasts player:left so peers drop them and recompute the expected
 *     submission count (game never gets stuck waiting on a departed player).
 *   - If the leaver was HOST, transfers host to the next active player (or
 *     closes the room if nobody is left).
 *   - If the leaver was the current QM mid-round, forfeits the turn: no points,
 *     round marked forfeited, everyone advanced to the leaderboard.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.json().catch(() => ({}))
  const { room_id, access_token: bodyToken } = body
  const authHeader = req.headers.get('Authorization') ?? (bodyToken ? `Bearer ${bodyToken}` : null)
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

  const { data: leaver } = await supabase
    .from('room_players')
    .select('is_host')
    .eq('room_id', room_id)
    .eq('player_id', user.id)
    .maybeSingle()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, code, status, current_qm_id, current_round')
    .eq('id', room_id)
    .maybeSingle()

  if (!room) return json({ error: 'ROOM_NOT_FOUND' }, 404)

  // Remove the player (idempotent — safe if they were already gone).
  await supabase.from('room_players').delete().eq('room_id', room_id).eq('player_id', user.id)
  await supabase.rpc('touch_room_activity', { p_room_id: room_id })

  const wasHost = !!leaver?.is_host
  const wasQM = room.current_qm_id === user.id
  const events: { event: string; payload: unknown }[] = [
    { event: 'player:left', payload: { player_id: user.id } },
  ]

  // Remaining active players in join order.
  const { data: remaining } = await supabase
    .from('room_players')
    .select('player_id, display_name')
    .eq('room_id', room_id)
    .eq('is_kicked', false)
    .order('joined_at', { ascending: true })

  // Nobody left — close the room.
  if (!remaining || remaining.length === 0) {
    await supabase.from('rooms').update({ status: 'closed' }).eq('id', room_id)
    await broadcast(supabase, room.code, [{ event: 'game:ended', payload: {} }])
    return json({ success: true, closed: true })
  }

  // Host transfer.
  if (wasHost) {
    const newHost = remaining[0]
    await supabase
      .from('room_players')
      .update({ is_host: true })
      .eq('room_id', room_id)
      .eq('player_id', newHost.player_id)
    await supabase.from('rooms').update({ host_id: newHost.player_id }).eq('id', room_id)
    events.push({
      event: 'host:changed',
      payload: { new_host_id: newHost.player_id, new_host_name: newHost.display_name },
    })
  }

  // QM forfeit — the current turn is abandoned. No points, advance to leaderboard.
  if (wasQM && IN_ROUND.has(room.status)) {
    await supabase
      .from('rounds')
      .update({ forfeited: true })
      .eq('room_id', room_id)
      .eq('round_number', room.current_round)
    await supabase.from('rooms').update({ status: 'round_results' }).eq('id', room_id)
    events.push({ event: 'round:forfeited', payload: { reason: 'qm_left' } })
  }

  await broadcast(supabase, room.code, events)
  return json({ success: true, host_transferred: wasHost, forfeited: wasQM })
})
