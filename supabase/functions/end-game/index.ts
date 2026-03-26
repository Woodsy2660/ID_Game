import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Read body first — sendBeacon calls pass access_token in body instead of header
  const body = await req.json().catch(() => ({}))
  const { room_id, access_token: bodyToken } = body

  const authHeader = req.headers.get('Authorization') ?? (bodyToken ? `Bearer ${bodyToken}` : null)

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

  // Verify caller is the host
  const { data: roomPlayer } = await supabase
    .from('room_players')
    .select('is_host')
    .eq('room_id', room_id)
    .eq('player_id', user.id)
    .single()

  if (!roomPlayer?.is_host) {
    return new Response(JSON.stringify({ error: 'FORBIDDEN' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch room code for broadcast channel
  const { data: room } = await supabase
    .from('rooms')
    .select('code')
    .eq('id', room_id)
    .single()

  if (!room) {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Mark room as closed
  await supabase
    .from('rooms')
    .update({ status: 'closed' })
    .eq('id', room_id)

  // Broadcast game:ended to all clients
  const channel = supabase.channel(`game:${room.code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'game:ended',
          payload: {},
        })
        await supabase.removeChannel(channel)
        resolve()
      }
    })
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
