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

  // Verify player is in the room
  const { data: roomPlayer } = await supabase
    .from('room_players')
    .select('is_host')
    .eq('room_id', room_id)
    .eq('player_id', user.id)
    .single()

  if (!roomPlayer) {
    return new Response(JSON.stringify({ error: 'NOT_IN_ROOM' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (roomPlayer.is_host) {
    return new Response(JSON.stringify({ error: 'HOST_CANNOT_LEAVE' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch room code for broadcast
  const { data: room } = await supabase
    .from('rooms')
    .select('code')
    .eq('id', room_id)
    .single()

  // Remove player from room
  await supabase
    .from('room_players')
    .delete()
    .eq('room_id', room_id)
    .eq('player_id', user.id)

  if (room) {
    const channel = supabase.channel(`game:${room.code}`)
    await new Promise<void>((resolve) => {
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'player:left',
            payload: { player_id: user.id },
          })
          await supabase.removeChannel(channel)
          resolve()
        }
      })
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
