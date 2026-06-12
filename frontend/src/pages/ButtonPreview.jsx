export default function ButtonPreview() {
  const sections = [
    {
      label: 'Primary  ·  btn-primary',
      desc: 'Main CTA — Send a package, Post trip, Submit forms',
      buttons: [
        { text: 'Send a package', cls: 'btn btn-primary' },
        { text: 'Post trip', cls: 'btn btn-primary' },
        { text: 'Get started — it\'s free', cls: 'btn btn-primary' },
        { text: 'Posting…', cls: 'btn btn-primary', disabled: true },
      ],
    },
    {
      label: 'Outline  ·  btn-outline',
      desc: 'Secondary actions — Cancel, Sign out, Carry & earn',
      buttons: [
        { text: 'Carry & earn', cls: 'btn btn-outline' },
        { text: 'Cancel', cls: 'btn btn-outline' },
        { text: 'Sign out', cls: 'btn btn-outline' },
        { text: 'Mark as matched', cls: 'btn btn-outline' },
      ],
    },
    {
      label: 'Danger  ·  btn-danger',
      desc: 'Destructive actions — Delete listing',
      buttons: [
        { text: 'Delete', cls: 'btn btn-danger' },
        { text: 'Remove', cls: 'btn btn-danger' },
      ],
    },
  ]

  return (
    <main style={{ paddingTop: 80, padding: '80px 48px 48px', background: '#FAF6F1', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Button System</h1>
      <p style={{ fontSize: 13, color: '#7A6555', marginBottom: 40 }}>All button variants used across CarryKaro.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 720 }}>
        {sections.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1.5px solid #E8DDD4', borderRadius: 16, padding: '28px 32px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1209', fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#7A6555', marginTop: 2 }}>{s.desc}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              {s.buttons.map(b => (
                <button key={b.text} className={b.cls} disabled={b.disabled} style={b.disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                  {b.text}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Side by side comparison */}
        <div style={{ background: '#fff', border: '1.5px solid #E8DDD4', borderRadius: 16, padding: '28px 32px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1209' }}>In context — My Listings card</div>
            <div style={{ fontSize: 12, color: '#7A6555', marginTop: 2 }}>How the action buttons look inside a card</div>
          </div>
          <div style={{ border: '1.5px solid #E8DDD4', borderRadius: 16, padding: '20px 24px', maxWidth: 340 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7A6555', marginBottom: 6 }}>TRIP</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Bangalore → Mumbai</div>
            <div style={{ fontSize: 13, color: '#7A6555', margin: '4px 0 16px' }}>flight · 2kg free · 20 Jun 2026</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E8601C', marginBottom: 16 }}>Earn ₹500+</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }}>Mark as matched</button>
              <button className="btn btn-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
