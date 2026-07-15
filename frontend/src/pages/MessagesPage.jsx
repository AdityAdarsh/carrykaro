import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import { STATUS_COLORS } from '../components/ui/StatusBadge'

export default function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [lastMessages, setLastMessages] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/matches/my')
      .then(async (ms) => {
        setMatches(ms)
        const msgs = {}
        await Promise.all(ms.map(async m => {
          try {
            const all = await api.get(`/chat/messages/${m.id}`)
            msgs[m.id] = all.length > 0 ? all[all.length - 1] : null
          } catch { msgs[m.id] = null }
        }))
        setLastMessages(msgs)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getOtherParty = (match) => {
    if (match.requests?.user_id === user?.id) return match.trips?.users?.name || 'Carrier'
    return match.requests?.users?.name || 'Sender'
  }

  const getRoute = (match) => {
    const r = match.requests
    return r ? `${r.from_city} → ${r.to_city}` : '—'
  }

  const isUnread = (match) => {
    const last = lastMessages[match.id]
    if (!last || last.sender_id === user?.id) return false
    const lastRead = localStorage.getItem(`chat_last_read_${match.id}`)
    return !lastRead || last.created_at > lastRead
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' })
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const STATUS_TEXT = {
    requested: 'Pending',
    accepted: 'Accepted',
    declined: 'Declined',
    delivered: 'Delivered',
    completed: 'Completed',
  }

  const statusLabel = (status) => ({
    text: STATUS_TEXT[status] || status,
    color: STATUS_COLORS[status] || 'var(--ink-light)',
  })

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Messages</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 32 }}>
          All your active matches and conversations.
        </p>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-light)', fontSize: 14 }}>
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            Getting the carriers moving…
          </div>
        )}

        {!loading && matches.length === 0 && (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No conversations yet</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-light)', maxWidth: 300, margin: '0 auto' }}>
              When you express interest in a listing — or someone expresses interest in yours — the chat will appear here.
            </p>
          </Card>
        )}

        {!loading && matches.length > 0 && (
          <div>
            {matches.map((match, i) => {
              const last = lastMessages[match.id]
              const unread = isUnread(match)
              const sl = statusLabel(match.status)

              return (
                <div
                  key={match.id}
                  onClick={() => navigate(`/chat/${match.id}`)}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'center',
                    padding: '16px 4px',
                    borderBottom: i < matches.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--saffron-pale)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    👤
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: unread ? 700 : 600, fontSize: 15, color: 'var(--ink)' }}>
                        {getOtherParty(match)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-light)', flexShrink: 0, marginLeft: 8 }}>
                        {formatTime(last?.created_at || match.created_at)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{getRoute(match)}</span>
                      <span style={{ fontSize: 11, color: sl.color, fontWeight: 600 }}>· {sl.text}</span>
                    </div>

                    <div style={{
                      fontSize: 13,
                      color: unread ? 'var(--ink)' : 'var(--ink-light)',
                      fontWeight: unread ? 600 : 400,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {last
                        ? (last.sender_id === user?.id ? `You: ${last.content}` : last.content)
                        : 'No messages yet · Tap to start chatting'}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {unread && (
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: 'var(--saffron)', flexShrink: 0,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
