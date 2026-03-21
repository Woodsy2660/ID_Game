import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { RoundStartedPayload } from '../store/types'

export interface AnswerSubmittedPayload {
  playerId: string
  guessedQuestionId: number
}

interface GameChannelHandlers {
  onAnswerSubmitted?: (payload: AnswerSubmittedPayload) => void
  onRoundStarted?: (payload: RoundStartedPayload) => void
  onQMReady?: () => void
}

interface GameChannelReturn {
  broadcastAnswer: (payload: AnswerSubmittedPayload) => Promise<void>
  broadcastQMReady: () => Promise<void>
}

/**
 * Subscribes to the game broadcast channel for a room.
 *
 * Handles two events:
 *   answer:submitted — another player locked in their answer
 *   round:started   — host triggered next round via start-round edge function
 *
 * Returns broadcastAnswer() to send a local player's submission to all peers.
 */
export function useGameChannel(
  roomCode: string,
  handlers: GameChannelHandlers
): GameChannelReturn {
  const channelRef = useRef<RealtimeChannel | null>(null)
  // Keep handlers in a ref so event callbacks always use the latest version
  // without needing to re-subscribe when handlers change between renders.
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!roomCode) return

    const channel = supabase
      .channel(`game:${roomCode}`)
      .on('broadcast', { event: 'answer:submitted' }, (event) => {
        handlersRef.current.onAnswerSubmitted?.(event.payload as AnswerSubmittedPayload)
      })
      .on('broadcast', { event: 'round:started' }, (event) => {
        handlersRef.current.onRoundStarted?.(event.payload as RoundStartedPayload)
      })
      .on('broadcast', { event: 'qm:ready' }, () => {
        handlersRef.current.onQMReady?.()
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomCode])

  const broadcastAnswer = async (payload: AnswerSubmittedPayload): Promise<void> => {
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'answer:submitted',
      payload,
    })
  }

  const broadcastQMReady = async (): Promise<void> => {
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'qm:ready',
      payload: {},
    })
  }

  return { broadcastAnswer, broadcastQMReady }
}
