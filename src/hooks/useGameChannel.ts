import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { removeChannelByName } from '../lib/channelCleanup'
import type { RoundStartedPayload } from '../store/types'
import { useGameStore } from '../store/gameStore'

export interface AnswerSubmittedPayload {
  playerId: string
  guessedQuestionId: number
}

export interface ResultsReadyPayload {
  submissions: Record<string, number>  // complete authoritative map: playerId → guessedQuestionId
}

export interface QMReadyPayload {
  answerPhaseStartedAt?: string
}

interface GameChannelHandlers {
  onAnswerSubmitted?: (payload: AnswerSubmittedPayload) => void
  onRoundStarted?: (payload: RoundStartedPayload) => void
  onQMReady?: (payload: QMReadyPayload) => void
  onResultsReady?: (payload: ResultsReadyPayload) => void
  onRoundExpired?: () => void   // fired by expire-round edge function when timer runs out
  onLeaderboardReady?: () => void
  onGameEnded?: () => void
  onPlayerLeft?: (playerId: string) => void
}

interface GameChannelReturn {
  broadcastAnswer: (payload: AnswerSubmittedPayload) => Promise<void>
  broadcastQMReady: () => Promise<void>
  broadcastResultsReady: (submissions: Record<string, number>) => Promise<void>
  broadcastLeaderboardReady: () => Promise<void>
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

    // Remove ALL existing channel instances for this topic.
    // supabase.channel() always creates new instances, so useRoom (lobby)
    // will have left one alive. Having multiple instances on the same topic
    // causes unreliable message delivery. Clean slate before subscribing.
    removeChannelByName(`game:${roomCode}`)

    const channel = supabase
      .channel(`game:${roomCode}`)
      .on('broadcast', { event: 'answer:submitted' }, (event) => {
        handlersRef.current.onAnswerSubmitted?.(event.payload as AnswerSubmittedPayload)
      })
      .on('broadcast', { event: 'round:started' }, (event) => {
        handlersRef.current.onRoundStarted?.(event.payload as RoundStartedPayload)
      })
      .on('broadcast', { event: 'qm:ready' }, (event) => {
        handlersRef.current.onQMReady?.(event.payload as QMReadyPayload)
      })
      .on('broadcast', { event: 'results:ready' }, (event) => {
        handlersRef.current.onResultsReady?.(event.payload as ResultsReadyPayload)
      })
      .on('broadcast', { event: 'round:results' }, () => {
        // Fired by expire-round when the answer timer runs out server-side
        handlersRef.current.onRoundExpired?.()
      })
      .on('broadcast', { event: 'leaderboard:ready' }, () => {
        handlersRef.current.onLeaderboardReady?.()
      })
      .on('broadcast', { event: 'game:ended' }, () => {
        handlersRef.current.onGameEnded?.()
      })
      .on('broadcast', { event: 'player:left' }, (event) => {
        const { player_id } = event.payload as { player_id: string }
        // Remove from store so allAnswered() recalculates correctly
        useGameStore.getState().removePlayer(player_id)
        handlersRef.current.onPlayerLeft?.(player_id)
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

  const broadcastResultsReady = async (submissions: Record<string, number>): Promise<void> => {
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'results:ready',
      payload: { submissions } satisfies ResultsReadyPayload,
    })
  }

  const broadcastLeaderboardReady = async (): Promise<void> => {
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'leaderboard:ready',
      payload: {},
    })
  }

  return { broadcastAnswer, broadcastQMReady, broadcastResultsReady, broadcastLeaderboardReady }
}
