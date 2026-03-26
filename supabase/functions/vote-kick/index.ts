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

  const { room_id, round_id, target_player_id } = await req.json()
  const voter_id = user.id

  // Validate voter is not kicking themselves
  if (voter_id === target_player_id) {
    return new Response(JSON.stringify({ error: 'CANNOT_KICK_SELF' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch all players in the room
  const { data: allPlayers } = await supabase
    .from('room_players')
    .select('player_id, display_name, is_kicked')
    .eq('room_id', room_id)

  if (!allPlayers) {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const voter = allPlayers.find((p) => p.player_id === voter_id)
  const target = allPlayers.find((p) => p.player_id === target_player_id)

  // Validate voter is active in the room
  if (!voter || voter.is_kicked) {
    return new Response(JSON.stringify({ error: 'VOTER_NOT_ELIGIBLE' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Validate target exists and is not already kicked
  if (!target || target.is_kicked) {
    return new Response(JSON.stringify({ error: 'TARGET_NOT_ELIGIBLE' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Insert vote (unique constraint prevents double-voting)
  const { error: insertError } = await supabase
    .from('kick_votes')
    .insert({ room_id, round_id, target_player_id, voter_id })

  if (insertError) {
    return new Response(JSON.stringify({ error: 'ALREADY_VOTED' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Count eligible voters (all non-kicked players except the target)
  const eligibleVoters = allPlayers.filter(
    (p) => p.player_id !== target_player_id && !p.is_kicked
  ).length

  // Count votes against target for this round
  const { count: voteCount } = await supabase
    .from('kick_votes')
    .select('*', { count: 'exact', head: true })
    .eq('round_id', round_id)
    .eq('target_player_id', target_player_id)

  const votes = voteCount ?? 0
  const votesNeeded = Math.floor(eligibleVoters / 2) + 1
  const majorityReached = votes >= votesNeeded

  // Fetch room code for broadcast
  const { data: room } = await supabase
    .from('rooms')
    .select('code, current_qm_id')
    .eq('id', room_id)
    .single()

  if (!room) {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let kicked = false

  if (majorityReached) {
    // Mark player as kicked
    await supabase
      .from('room_players')
      .update({ is_kicked: true })
      .eq('room_id', room_id)
      .eq('player_id', target_player_id)

    kicked = true
  }

  // Broadcast kick:vote_update to all clients regardless
  const channel = supabase.channel(`game:${room.code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Always broadcast vote count update
        await channel.send({
          type: 'broadcast',
          event: 'kick:vote_update',
          payload: {
            target_player_id,
            vote_count: votes,
            votes_needed: votesNeeded,
            eligible_voters: eligibleVoters,
          },
        })

        // If kicked, also broadcast player:kicked
        if (kicked) {
          await channel.send({
            type: 'broadcast',
            event: 'player:kicked',
            payload: {
              target_player_id,
              display_name: target.display_name,
            },
          })
        }

        await supabase.removeChannel(channel)
        resolve()
      }
    })
  })

  return new Response(JSON.stringify({ kicked, vote_count: votes, votes_needed: votesNeeded }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
