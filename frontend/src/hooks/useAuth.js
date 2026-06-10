import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import posthog from '../lib/posthog'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user
        posthog.identify(u.id, { email: u.email })
        const isNew = Date.now() - new Date(u.created_at).getTime() < 60000
        if (isNew) posthog.capture('signup_completed', { method: 'google' })
      }
      if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signOut }
}
