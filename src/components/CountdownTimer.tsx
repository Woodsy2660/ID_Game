import React, { useEffect, useRef, useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { Colors } from '../theme'

interface CountdownTimerProps {
  answerPhaseStartedAt: string  // ISO timestamp from round row
  durationSeconds?: number      // default 180 (3 minutes)
  onExpire: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CountdownTimer({
  answerPhaseStartedAt,
  durationSeconds = 180,
  onExpire,
}: CountdownTimerProps) {
  const expireCalled = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const calcRemaining = () => {
    const elapsed = (Date.now() - new Date(answerPhaseStartedAt).getTime()) / 1000
    return Math.max(0, Math.floor(durationSeconds - elapsed))
  }

  const [remaining, setRemaining] = useState(calcRemaining)

  useEffect(() => {
    expireCalled.current = false

    const tick = setInterval(() => {
      const r = calcRemaining()
      setRemaining(r)
      if (r <= 0 && !expireCalled.current) {
        expireCalled.current = true
        clearInterval(tick)
        onExpireRef.current()
      }
    }, 1000)

    return () => clearInterval(tick)
  }, [answerPhaseStartedAt, durationSeconds])

  const color =
    remaining <= 30
      ? Colors.error
      : remaining <= 60
      ? Colors.amber
      : Colors.white

  return <Text style={[styles.timer, { color }]}>{formatTime(remaining)}</Text>
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
})
