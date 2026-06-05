import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

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
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      backdropFilter: 'blur(12px)',
      background: 'rgba(250, 246, 241, 0.88)',
      borderBottom: '1px solid var(--border)',
      height: '60px',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Link to="/" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.5px' }}>
          Carry<span style={{ color: 'var(--saffron)' }}>Karo</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {user ? (
            <>
              {[[ '/browse', 'Browse'], ['/post-request', 'Send'], ['/post-trip', 'Carry'], ['/profile', 'Profile']].map(([to, label]) => (
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
      </div>
    </nav>
  )
}
