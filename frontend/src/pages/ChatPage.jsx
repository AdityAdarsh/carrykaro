import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useChat } from '../hooks/useChat'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'

export default function ChatPage() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const { messages, loading, sendMessage } = useChat(matchId)
  const [input, setInput] = useState('')
  const [match, setMatch] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const bottomRef = useRef(null)

  const loadMatch = useCallback(() => {
    api.get(`/matches/${matchId}`).then(setMatch).catch(() => {})
  }, [matchId])

  useEffect(() => { loadMatch() }, [loadMatch])

  // Refresh match status when the other party accepts/declines/marks delivered/received
  useEffect(() => {
    if (!matchId) return
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        () => loadMatch()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [matchId, loadMatch])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Tell useNotifications not to badge while this chat is open;
  // and stamp the last-read time for the inbox unread dot
  useEffect(() => {
    localStorage.setItem(`chat_last_read_${matchId}`, new Date().toISOString())
    return () => {
      localStorage.setItem(`chat_last_read_${matchId}`, new Date().toISOString())
    }
  }, [matchId])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input.trim())
    setInput('')
  }

  const runAction = async (path) => {
    setActionLoading(true)
    setActionError('')
    try {
      await api.post(`/matches/${matchId}/${path}`)
      loadMatch()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const requestOwnerId = match?.requests?.user_id
  const tripOwnerId = match?.trips?.user_id
  const isInitiator = user?.id === match?.initiated_by
  const isSender = user?.id === requestOwnerId
  const isTraveller = user?.id === tripOwnerId

  const renderStatusAction = () => {
    if (!match) return null
    const { status } = match
    if (status === 'requested') {
      if (isInitiator) return <p style={{ fontSize: 13, color: 'var(--ink-light)' }}>Waiting for a response…</p>
      return (
        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={() => runAction('accept')} disabled={actionLoading}>Accept</Button>
          <Button variant="outline" onClick={() => runAction('decline')} disabled={actionLoading}>Decline</Button>
        </div>
      )
    }
    if (status === 'accepted') {
      if (isTraveller) return <Button onClick={() => runAction('mark-delivered')} disabled={actionLoading}>Mark as delivered</Button>
      return <p style={{ fontSize: 13, color: 'var(--ink-light)' }}>Waiting for traveller to deliver the package…</p>
    }
    if (status === 'delivered') {
      if (isSender) return <Button onClick={() => runAction('mark-received')} disabled={actionLoading}>Mark as received</Button>
      return <p style={{ fontSize: 13, color: 'var(--ink-light)' }}>Waiting for sender to confirm receipt…</p>
    }
    if (status === 'completed') return <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Completed ✓</p>
    if (status === 'declined') return <p style={{ fontSize: 13, color: '#CC3333' }}>Match declined</p>
    return null
  }

  return (
    <main style={{ paddingTop: 60, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px var(--page-px)', background: 'var(--white)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Match chat</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 12 }}>No phone numbers shared. Keep it here until you've confirmed.</p>
        {match && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <StatusBadge status={match.status} />
            {renderStatusAction()}
          </div>
        )}
        {actionError && <p style={{ fontSize: 12, color: '#CC3333', marginTop: 8 }}>{actionError}</p>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px var(--page-px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ color: 'var(--ink-light)', fontSize: 14 }}>Loading messages…</p>}
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: 12,
                background: isMe ? 'var(--saffron)' : 'var(--white)',
                color: isMe ? 'var(--white)' : 'var(--ink)',
                border: isMe ? 'none' : '1.5px solid var(--border)',
                fontSize: 14,
              }}>
                {msg.content}
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ borderTop: '1px solid var(--border)', padding: '16px var(--page-px)', display: 'flex', gap: 12, background: 'var(--white)' }}>
        <input className="input" style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Message…" />
        <button type="submit" className="btn btn-primary" disabled={!input.trim()}>Send</button>
      </form>
    </main>
  )
}
