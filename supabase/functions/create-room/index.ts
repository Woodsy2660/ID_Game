import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isValidPack } from '../_shared/questionPacks.ts'

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

  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) return json({ error: 'Unauthorized, user fetch failed' }, 401)

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { display_name, pack, adult_confirmed, adult_warning_version } = await req.json()
  const uid = user.id

  // ── Validate pack (required, fixed for the whole game) ──────────────────────
  if (!isValidPack(pack)) return json({ error: 'INVALID_PACK' }, 400)

  // ── Mature pack requires the host's own 18+ confirmation up front ───────────
  const isMature = pack === 'infamous'
  if (isMature && (adult_confirmed !== true || !adult_warning_version)) {
    return json({ error: 'ADULT_CONFIRMATION_REQUIRED' }, 403)
  }
  const consentAt = isMature ? new Date().toISOString() : null
  const consentVersion = isMature ? String(adult_warning_version) : null

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
        .insert({ code, host_id: uid, status: 'lobby', pack })
        .select('id')
        .single()
      if (!roomError && room) {
        room_id = room.id
        break
      }
    }
  }

  if (!room_id) return json({ error: 'Failed to generate unique room code' }, 500)

  await supabaseAdmin.from('room_players').insert({
    room_id,
    player_id: uid,
    display_name,
    is_host: true,
    adult_confirmed_at: consentAt,
    adult_confirmed_version: consentVersion,
  })

  return json({ room_id, room_code: code, pack })
})
