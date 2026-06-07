import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const MOBILE_NAV = [
  { to: '/browse',       label: 'Browse',  icon: '🔍' },
  { to: '/post-request', label: 'Send',    icon: '📦' },
  { to: '/post-trip',    label: 'Carry',   icon: '🧳' },
  { to: '/profile',      label: 'Profile', icon: '👤' },
]

export default function Nav() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (to) => pathname === to || pathname.startsWith(to + '/')

  const navLink = (to) => ({
    fontSize: 14,
    fontWeight: 500,
    color: isActive(to) ? 'var(--saffron)' : 'var(--ink-mid)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  })

  const dot = (to) => ({
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: isActive(to) ? 'var(--saffron)' : 'transparent',
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

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
                <button className="btn btn-outline" onClick={handleSignOut} style={{ fontSize: 13, padding: '7px 16px' }}>Sign out</button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">Get started</Link>
            )}
          </div>

          {/* Mobile: compact action (replaces hidden desktop nav) */}
          {user ? (
            <button className="nav-signout-mobile btn btn-outline" onClick={handleSignOut} style={{ fontSize: 12, padding: '6px 12px' }}>Sign out</button>
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
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: 10,
              fontWeight: 600,
              color: isActive(to) ? 'var(--saffron)' : 'var(--ink-light)',
              textDecoration: 'none',
              padding: '6px 4px',
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
