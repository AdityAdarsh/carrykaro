import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export function useChat(matchId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return

    // Load history
    api.get(`/chat/messages/${matchId}`).then((msgs) => {
      setMessages(msgs)
      setLoading(false)
    })

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [matchId])

  const sendMessage = async (content) => {
    await api.post('/chat/messages', { match_id: matchId, content })
  }

  return { messages, loading, sendMessage }
}
