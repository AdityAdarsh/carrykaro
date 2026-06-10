import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

const MOBILE_NAV = [
  { to: '/browse',       label: 'Browse',  icon: '🔍' },
  { to: '/post-request', label: 'Send',    icon: '📦' },
  { to: '/post-trip',    label: 'Carry',   icon: '🧳' },
  { to: '/profile',      label: 'Profile', icon: '👤' },
]

function Badge({ count }) {
  if (!count) return null
  return (
    <span style={{
      position: 'absolute', top: -5, right: -5,
      minWidth: 16, height: 16, borderRadius: 8,
      background: '#e53e3e', color: '#fff',
      fontSize: 10, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 3px', lineHeight: 1, pointerEvents: 'none',
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function IconBtn({ onClick, children, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      position: 'relative', background: 'none', border: 'none',
      cursor: 'pointer', fontSize: 20, lineHeight: 1,
      padding: '4px 6px', borderRadius: 8, display: 'flex',
      alignItems: 'center', color: 'var(--ink)',
    }}>
      {children}
    </button>
  )
}

export default function Nav() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { unreadMessages, notifications, clearNotifications, clearMessageUnread } = useNotifications(user?.id)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const isActive = (to) => pathname === to || pathname.startsWith(to + '/')

  const navLink = (to) => ({
    fontSize: 14, fontWeight: 500,
    color: isActive(to) ? 'var(--saffron)' : 'var(--ink-mid)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  })

  const dot = (to) => ({
    width: 4, height: 4, borderRadius: '50%',
    background: isActive(to) ? 'var(--saffron)' : 'transparent',
  })

  // Close notifications dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const openMessages = () => {
    clearMessageUnread()
    navigate('/messages')
  }

  const openNotifications = () => {
    setNotifOpen(v => !v)
  }

  const formatNotifTime = (ts) => {
    if (!ts) return ''
    const diff = Date.now() - new Date(ts).getTime()
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const notifIcon = (type) => type === 'match_accepted' ? '✅' : type === 'match_declined' ? '❌' : '🤝'

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
        background: 'rgba(250, 246, 241, 0.88)',
        borderBottom: '1px solid var(--border)',
        height: '60px',
        display: 'flex', alignItems: 'center',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Link to={user ? '/browse' : '/'} style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.5px' }}>
            Carry<span style={{ color: 'var(--saffron)' }}>Karo</span>
          </Link>

          {/* Desktop nav */}
          <div className="nav-links-desktop">
            {user ? (
              <>
                {[['/browse', 'Browse'], ['/post-request', 'Send'], ['/post-trip', 'Carry'], ['/profile', 'Profile']].map(([to, label]) => (
                  <Link key={to} to={to} style={navLink(to)}>
                    <span>{label}</span>
                    <span style={dot(to)} />
                  </Link>
                ))}
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">Get started</Link>
            )}
          </div>

          {/* Right icons — shown when logged in */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Messages */}
              <IconBtn onClick={openMessages} title="Messages">
                💬
                <Badge count={unreadMessages} />
              </IconBtn>

              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <IconBtn onClick={openNotifications} title="Notifications">
                  🔔
                  <Badge count={notifications.length} />
                </IconBtn>

                {/* Dropdown */}
                {notifOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 320, background: 'var(--white)',
                    border: '1.5px solid var(--border)', borderRadius: 14,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                    zIndex: 200, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                      {notifications.length > 0 && (
                        <button onClick={clearNotifications} style={{ fontSize: 12, color: 'var(--saffron)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-light)', fontSize: 13 }}>
                        You're all caught up 🎉
                      </div>
                    ) : (
                      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {notifications.map((n, i) => (
                          <div key={n.matchId} onClick={() => { navigate(`/chat/${n.matchId}`); setNotifOpen(false) }} style={{
                            display: 'flex', gap: 12, padding: '12px 16px',
                            borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                            cursor: 'pointer', alignItems: 'flex-start',
                          }}>
                            <span style={{ fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>{notifIcon(n.type)}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, marginBottom: 3, lineHeight: 1.4 }}>{n.text}</p>
                              <span style={{ fontSize: 11, color: 'var(--ink-light)' }}>{formatNotifTime(n.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-signout-mobile btn btn-primary" style={{ fontSize: 13, padding: '7px 14px' }}>Get started</Link>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="nav-bottom">
          {MOBILE_NAV.map(({ to, label, icon }) => (
            <Link key={to} to={to} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2, fontSize: 10, fontWeight: 600,
              color: isActive(to) ? 'var(--saffron)' : 'var(--ink-light)',
              textDecoration: 'none', padding: '6px 4px',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}
