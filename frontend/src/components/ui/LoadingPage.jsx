import { useState, useEffect } from 'react'

export default function LoadingPage() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <main style={{ padding: '80px var(--page-px)' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '50vh', gap: 14,
      }}>
        <div className="spinner" />
        <p style={{ color: 'var(--ink-light)', fontSize: 14, fontWeight: 500 }}>
          {slow ? 'Getting the carriers moving…' : 'Loading…'}
        </p>
      </div>
    </main>
  )
}
