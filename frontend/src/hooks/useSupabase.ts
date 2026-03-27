import { useEffect, useState } from 'react'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Hook to subscribe to real-time fill events
 */
export function useFillEvents(studioId?: string) {
  const [events, setEvents] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!studioId) return

    const newChannel = supabase
      .channel('fill-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'waitlist_fill_events',
          filter: `class_id=in.(SELECT id FROM classes WHERE studio_id='${studioId}')`
        },
        (payload) => {
          setEvents(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      newChannel.unsubscribe()
    }
  }, [studioId])

  return { events, channel }
}

/**
 * Hook to subscribe to churn signal updates
 */
export function useChurnSignals(studioId?: string) {
  const [signals, setSignals] = useState<any[]>([])

  useEffect(() => {
    if (!studioId) return

    const channel = supabase
      .channel('churn-signals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'member_churn_signals',
        },
        (payload) => {
          setSignals(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [studioId])

  return signals
}

/**
 * Hook for Supabase Auth
 */
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signOut }
}
