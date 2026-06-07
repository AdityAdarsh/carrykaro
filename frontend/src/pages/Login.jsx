import { supabase } from '../lib/supabase'

export default function Login() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/browse` },
    })
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px var(--page-px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.5px', marginBottom: 12 }}>
            Carry<span style={{ color: 'var(--saffron)' }}>Karo</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Sign in to get started</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', lineHeight: 1.6 }}>
            Send packages or carry &amp; earn on your trips — it only takes a second.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'center', gap: 10, padding: '12px 20px', fontSize: 15 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
            <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.8-2.7.8-2.1 0-3.87-1.41-4.5-3.32H1.8v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
            <path d="M4.48 10.53a4.8 4.8 0 0 1 0-3.06V5.4H1.8a8 8 0 0 0 0 7.2l2.68-2.07z" fill="#FBBC05"/>
            <path d="M8.98 4.15c1.18 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.8 5.4L4.48 7.47c.63-1.91 2.4-3.32 4.5-3.32z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-light)', lineHeight: 1.6 }}>
          No spam. Your data stays private.
        </p>
      </div>
    </main>
  )
}
