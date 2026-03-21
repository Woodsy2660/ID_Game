import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

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

  // Create a client purely to verify the user JWT
  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized, user fetch failed', details: authError }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create an admin client to interact with the database tables
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { display_name } = await req.json()
  const uid = user.id

  await supabaseAdmin.from('profiles').upsert({ id: uid, display_name })

  let room_id: string | null = null
  let code = ''

  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode()
    const { data: existing } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('code', code)
      .maybeSingle()

    if (!existing) {
      const { data: room, error: roomError } = await supabaseAdmin
        .from('rooms')
        .insert({ code, host_id: uid, status: 'lobby' })
        .select('id')
        .single()

      if (!roomError && room) {
        room_id = room.id
        break
      }
    }
  }

  if (!room_id) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate unique room code' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  await supabaseAdmin.from('room_players').insert({
    room_id,
    player_id: uid,
    display_name,
    is_host: true,
  })

  return new Response(JSON.stringify({ room_id, room_code: code }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
