import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * qm-ready — called by the QM after the reveal timer fires.
 *
 * 1. Writes answer_phase_started_at = now() to the current round row
 * 2. Updates room status to answer_phase
 * 3. Broadcasts qm:ready with the timestamp so all clients can sync their timers
 */
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

  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { room_code } = await req.json()

  // Fetch the room to get room_id and current round
  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('id, current_round')
    .eq('code', room_code)
    .single()

  const answerPhaseStartedAt = new Date().toISOString()

  if (room) {
    // Write timestamp to the current round row
    await supabaseAdmin
      .from('rounds')
      .update({ answer_phase_started_at: answerPhaseStartedAt })
      .eq('room_id', room.id)
      .eq('round_number', room.current_round)

    // Update room status to answer_phase
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'answer_phase' })
      .eq('id', room.id)
  }

  const channel = supabaseAdmin.channel(`game:${room_code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'qm:ready',
          payload: { answerPhaseStartedAt },
        })
        await supabaseAdmin.removeChannel(channel)
        resolve()
      }
    })
  })

  return new Response(JSON.stringify({ ok: true, answerPhaseStartedAt }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
