import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useChat } from '../hooks/useChat'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../lib/utils'

export default function ChatPage() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const { messages, loading, sendMessage } = useChat(matchId)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

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

  return (
    <main style={{ paddingTop: 60, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px var(--page-px)', background: 'var(--white)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Match chat</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-light)' }}>No phone numbers shared. Keep it here until you've confirmed.</p>
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
