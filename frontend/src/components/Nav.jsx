import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Nav() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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
        <Link to="/" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
          Carry<span style={{ color: 'var(--saffron)' }}>Karo</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {user ? (
            <>
              <Link to="/browse" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-mid)' }}>Browse</Link>
              <Link to="/post-request" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-mid)' }}>Send</Link>
              <Link to="/post-trip" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-mid)' }}>Carry</Link>
              <Link to="/profile" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-mid)' }}>Profile</Link>
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
