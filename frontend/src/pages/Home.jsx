import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import posthog from '../lib/posthog'

export default function Home() {
  useEffect(() => {
    posthog.capture('landing_page_visit')
  }, [])

  return (
    <main style={{ paddingTop: 60 }}>
      <section className="hero-grid" style={{ background: `
          radial-gradient(ellipse at 20% 50%, rgba(232,96,28,0.10) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(232,96,28,0.06) 0%, transparent 50%)
        ` }}>
        <div>
          <span className="label" style={{ marginBottom: 16, display: 'block' }}>P2P Delivery · India</span>
          <h1 className="hero-h1" style={{ fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
            Someone's already<br />
            <em style={{ fontStyle: 'italic', color: 'var(--saffron)' }}>going your way.</em>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: 40, maxWidth: 480 }}>
            Skip the courier. Connect with travellers heading between cities and get your package delivered by a real person — faster, cheaper, and with a conversation.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/login" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px' }} onClick={() => posthog.capture('get_started_click', { cta: 'send_package' })}>
              Send a package
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ fontSize: 15, padding: '12px 28px' }} onClick={() => posthog.capture('get_started_click', { cta: 'carry_earn' })}>
              Carry &amp; earn
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 380, width: '100%' }}>
            <div style={{ marginBottom: 20 }}>
              <span className="label">Open request</span>
              <div className="status-badge" style={{ float: 'right' }}>
                <span className="dot" />
                Live
              </div>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Bangalore → Mumbai</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 16 }}>Electronics · 1.2 kg · by 30 May</p>
            <div className="divider" />
            <p style={{ fontSize: 13, color: 'var(--ink-mid)' }}>
              "Laptop charger urgently needed — happy to pay ₹300–400 for someone flying tomorrow."
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
