import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { setCachedToken } from '../lib/tokenCache'

interface UseAuthReturn {
  session: Session | null
  user: User | null
  loading: boolean
  authError: string | null
  setDisplayName: (name: string) => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCachedToken(data.session.access_token)
        setSession(data.session)
        setLoading(false)
      } else {
        supabase.auth.signInAnonymously().then(({ data: signInData, error }) => {
          if (error) {
            setAuthError(error.message)
          } else {
            setCachedToken(signInData.session?.access_token ?? null)
            setSession(signInData.session)
          }
          setLoading(false)
        })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setCachedToken(newSession?.access_token ?? null)
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const setDisplayName = async (name: string) => {
    const uid = session?.user?.id
    if (!uid) return
    await supabase.from('profiles').upsert({ id: uid, display_name: name })
  }

  return {
    session,
    user: session?.user ?? null,
    loading,
    authError,
    setDisplayName,
  }
}
