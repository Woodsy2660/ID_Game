import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { pickQuestion, pickDecoys, isValidPack, type PackId } from '../_shared/questionPacks.ts'

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

  const { room_id } = await req.json()

  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('id, code, host_id, status, used_question_ids, pack')
    .eq('id', room_id)
    .single()

  if (!room) return json({ error: 'ROOM_NOT_FOUND' }, 404)
  if (room.host_id !== user.id) return json({ error: 'FORBIDDEN' }, 403)
  if (room.status !== 'lobby') return json({ error: 'ROOM_NOT_IN_LOBBY' }, 409)

  const pack: PackId = isValidPack(room.pack) ? room.pack : 'boys'

  const { data: roomPlayers } = await supabaseAdmin
    .from('room_players')
    .select('player_id, display_name, is_host')
    .eq('room_id', room_id)
    .eq('is_kicked', false)
    .order('joined_at', { ascending: true })

  if (!roomPlayers || roomPlayers.length < 2) return json({ error: 'NOT_ENOUGH_PLAYERS' }, 400)

  const players = roomPlayers.map((p) => ({
    id: p.player_id,
    displayName: p.display_name,
    isHost: p.is_host,
  }))

  const qmPlayerId = players[0].id

  const usedIds: number[] = room.used_question_ids ?? []
  const questionId = pickQuestion(pack, usedIds)
  const decoyIds = pickDecoys(pack, questionId, usedIds, 5)
  const visibleQuestionIds = [questionId, ...decoyIds].sort(() => Math.random() - 0.5)

  await supabaseAdmin
    .from('rooms')
    .update({
      status: 'active',
      current_round: 1,
      current_qm_id: qmPlayerId,
      used_question_ids: [...usedIds, questionId],
      last_active_at: new Date().toISOString(),
    })
    .eq('id', room_id)

  const { data: roundRecord } = await supabaseAdmin
    .from('rounds')
    .insert({
      room_id,
      round_number: 1,
      qm_id: qmPlayerId,
      question_id: questionId,
      visible_question_ids: visibleQuestionIds,
    })
    .select('id')
    .single()

  const roundId: string = roundRecord!.id

  const broadcastPayload = { players, qmPlayerId, questionId, visibleQuestionIds, roundId, pack }

  const channel = supabaseAdmin.channel(`game:${room.code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({ type: 'broadcast', event: 'game:started', payload: broadcastPayload })
        await supabaseAdmin.removeChannel(channel)
        resolve()
      }
    })
  })

  return json({ ok: true })
})
