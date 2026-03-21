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
    .select('id, status')
    .ilike('code', room_code)
    .maybeSingle()

  if (!room) {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_FOUND' }), { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (room.status !== 'lobby') {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_IN_LOBBY' }), { 
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  await supabase.from('room_players').insert({
    room_id: room.id,
    player_id: uid,
    display_name,
    is_host: false,
  })

  return new Response(JSON.stringify({ room_id: room.id, room_code }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
