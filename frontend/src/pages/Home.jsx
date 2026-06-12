import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import posthog from '../lib/posthog'

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Post your need',
    desc: 'Sender posts item details and budget. Traveller posts their route with spare capacity.',
  },
  {
    step: '2',
    title: 'Express interest',
    desc: 'When routes match, one party taps to connect. No spam — only relevant matches reach you.',
  },
  {
    step: '3',
    title: 'Coordinate & handoff',
    desc: 'Chat in-app, agree on pickup details, and complete the handoff. Done.',
  },
]

const WHY_CARDS = [
  { icon: '💸', title: '30–50% cheaper', desc: 'Set your own budget. Travellers with spare space compete to carry for you.' },
  { icon: '⚡', title: 'Same-day on popular routes', desc: "Bangalore ↔ Mumbai, Delhi ↔ Pune and more — someone's heading there today." },
  { icon: '🎒', title: 'Earn on every trip', desc: 'Turn spare bag space into ₹200–800 per carry. No commitment, carry when you want.' },
  { icon: '🤝', title: 'Real people, real accountability', desc: 'Every user has a verified profile. Chat before you commit.' },
]

export default function Home() {
  useEffect(() => {
    posthog.capture('landing_page_visit')
  }, [])

  return (
    <main style={{ paddingTop: 60 }}>
      {/* Hero */}
      <section className="hero-grid" style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(232,96,28,0.10) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(232,96,28,0.06) 0%, transparent 50%)
        `
      }}>
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

      {/* How It Works */}
      <section style={{ padding: '80px var(--page-px)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <span className="label" style={{ marginBottom: 12, display: 'block' }}>How it works</span>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 56, color: 'var(--ink)' }}>Three steps to delivered</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--saffron)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, marginBottom: 20, flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CarryKaro */}
      <section style={{ padding: '80px var(--page-px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <span className="label" style={{ marginBottom: 12, display: 'block' }}>Why CarryKaro</span>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 56, color: 'var(--ink)' }}>
            Better for everyone on the route
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {WHY_CARDS.map(card => (
              <div key={card.title} className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{card.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 56 }}>
            <Link to="/login" className="btn btn-primary" style={{ fontSize: 15, padding: '14px 36px' }} onClick={() => posthog.capture('get_started_click', { cta: 'bottom_cta' })}>
              Get started — it's free
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
