import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Keep in sync with src/data/questionBank.json and start-game/index.ts
const QUESTION_BANK: { id: number; text: string }[] = [
  { "id": 1, "text": "Most likely to survive a zombie apocalypse" },
  { "id": 2, "text": "Least likely to read the terms and conditions" },
  { "id": 3, "text": "Most likely to accidentally start drama in a group chat" },
  { "id": 4, "text": "Most likely to cry during a movie" },
  { "id": 5, "text": "Most likely to become famous" },
  { "id": 6, "text": "Most likely to survive longest in the wild" },
  { "id": 7, "text": "Most likely to forget someone's name mid-conversation" },
  { "id": 8, "text": "Most likely to become a millionaire" },
  { "id": 9, "text": "Most likely to show up late to their own wedding" },
  { "id": 10, "text": "Most likely to go viral on social media" },
  { "id": 11, "text": "Most likely to win an eating contest" },
  { "id": 12, "text": "Most likely to get lost in their own city" },
  { "id": 13, "text": "Most likely to befriend a stranger on a plane" },
  { "id": 14, "text": "Least likely to remember your birthday" },
  { "id": 15, "text": "Most likely to survive on a deserted island" },
  { "id": 16, "text": "Most likely to accidentally send a text to the wrong person" },
  { "id": 17, "text": "Most likely to adopt five or more pets" },
  { "id": 18, "text": "Most likely to write a book" },
  { "id": 19, "text": "Most likely to binge an entire series in one sitting" },
  { "id": 20, "text": "Most likely to start a business" },
  { "id": 21, "text": "Most likely to laugh at the wrong moment" },
  { "id": 22, "text": "Most likely to get into an argument with a stranger" },
  { "id": 23, "text": "Most likely to win a dance competition" },
  { "id": 24, "text": "Most likely to fall asleep in a public place" },
  { "id": 25, "text": "Most likely to live in another country" },
  { "id": 26, "text": "Most likely to talk their way out of a speeding ticket" },
  { "id": 27, "text": "Most likely to accidentally break something expensive" },
  { "id": 28, "text": "Most likely to be the last one standing at a party" },
  { "id": 29, "text": "Most likely to run a marathon" },
  { "id": 30, "text": "Most likely to forget where they parked" },
  { "id": 31, "text": "Most likely to become a reality TV star" },
  { "id": 32, "text": "Most likely to secretly be a genius" },
  { "id": 33, "text": "Most likely to get away with a lie" },
  { "id": 34, "text": "Most likely to drop their phone in a toilet" },
  { "id": 35, "text": "Most likely to know all the gossip" },
  { "id": 36, "text": "Most likely to give unsolicited advice" },
  { "id": 37, "text": "Most likely to ghost someone" },
  { "id": 38, "text": "Most likely to win a trivia game" },
  { "id": 39, "text": "Most likely to start a conspiracy theory" },
  { "id": 40, "text": "Most likely to lock themselves out of their house" },
  { "id": 41, "text": "Most likely to get a tattoo on impulse" },
  { "id": 42, "text": "Most likely to still use a flip phone" },
  { "id": 43, "text": "Most likely to become a politician" },
  { "id": 44, "text": "Most likely to cry at a wedding" },
  { "id": 45, "text": "Most likely to get into a fight over food" },
  { "id": 46, "text": "Most likely to sleep through an alarm" },
  { "id": 47, "text": "Most likely to accidentally reveal a surprise" },
  { "id": 48, "text": "Most likely to go skydiving" },
  { "id": 49, "text": "Most likely to have the best comeback" },
  { "id": 50, "text": "Most likely to still be using the same phone case in 10 years" },
]

function pickQuestion(usedIds: number[]): number {
  const available = QUESTION_BANK.filter((q) => !usedIds.includes(q.id))
  const pool = available.length > 0 ? available : QUESTION_BANK
  return pool[Math.floor(Math.random() * pool.length)].id
}

function pickDecoys(correctId: number, usedIds: number[], count: number): number[] {
  const pool = QUESTION_BANK
    .filter((q) => q.id !== correctId && !usedIds.includes(q.id))
    .map((q) => q.id)
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized, no auth header' }), {
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
    return new Response(JSON.stringify({ error: 'Unauthorized, user fetch failed', details: authError }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { room_id } = await req.json()

  // Fetch room and verify caller is the host
  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('id, code, host_id, status, current_round, used_question_ids')
    .eq('id', room_id)
    .single()

  if (!room) {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (room.host_id !== user.id) {
    return new Response(JSON.stringify({ error: 'FORBIDDEN' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (room.status === 'closed' || room.status === 'lobby') {
    return new Response(JSON.stringify({ error: 'ROOM_NOT_ACTIVE' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch players in join order — this order drives QM rotation
  const { data: roomPlayers } = await supabaseAdmin
    .from('room_players')
    .select('player_id, display_name, is_host')
    .eq('room_id', room_id)
    .order('joined_at', { ascending: true })

  if (!roomPlayers || roomPlayers.length === 0) {
    return new Response(JSON.stringify({ error: 'NO_PLAYERS' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const players = roomPlayers.map((p) => ({
    id: p.player_id,
    displayName: p.display_name,
    isHost: p.is_host,
  }))

  const nextRoundNumber = (room.current_round ?? 0) + 1
  const qmIdx = (nextRoundNumber - 1) % players.length
  const qmPlayerId = players[qmIdx].id

  const usedIds: number[] = room.used_question_ids ?? []
  const questionId = pickQuestion(usedIds)
  const decoyIds = pickDecoys(questionId, usedIds, 9)
  const visibleQuestionIds = [questionId, ...decoyIds].sort(() => Math.random() - 0.5)

  // Update room — set status to qm_active so rejoiners during this phase land correctly
  await supabaseAdmin
    .from('rooms')
    .update({
      status: 'qm_active',
      current_round: nextRoundNumber,
      current_qm_id: qmPlayerId,
      used_question_ids: [...usedIds, questionId],
    })
    .eq('id', room_id)

  // Insert round record
  const { data: roundRecord } = await supabaseAdmin
    .from('rounds')
    .insert({
      room_id,
      round_number: nextRoundNumber,
      qm_id: qmPlayerId,
      question_id: questionId,
      visible_question_ids: visibleQuestionIds,
    })
    .select('id')
    .single()

  const roundId: string = roundRecord!.id

  // Broadcast round:started to all clients
  const broadcastPayload = {
    players,
    qmPlayerId,
    questionId,
    visibleQuestionIds,
    roundId,
    roundNumber: nextRoundNumber,
  }

  const channel = supabaseAdmin.channel(`game:${room.code}`)
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'round:started',
          payload: broadcastPayload,
        })
        await supabaseAdmin.removeChannel(channel)
        resolve()
      }
    })
  })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
