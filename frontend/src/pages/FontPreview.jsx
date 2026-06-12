export default function FontPreview() {
  const fonts = [
    { name: 'Syne (current logo)', family: "'Syne', sans-serif", weight: 800, desc: 'Current logo font' },
    { name: 'Plus Jakarta Sans (current body)', family: "'Plus Jakarta Sans', sans-serif", weight: 800, desc: 'Current body/regular text font' },
    { name: 'Bebas Neue', family: "'Bebas Neue', cursive", weight: 400, desc: 'Your favourite · Tall · Condensed · Bold stamp' },
    { name: 'Anton', family: "'Anton', sans-serif", weight: 400, desc: 'Slightly wider · More impact · Very close to Bebas' },
    { name: 'Oswald', family: "'Oswald', sans-serif", weight: 700, desc: 'Condensed · Cleaner · More refined' },
    { name: 'Barlow Condensed', family: "'Barlow Condensed', sans-serif", weight: 800, desc: 'Condensed · Sharp · Modern edge' },
    { name: 'Big Shoulders Display', family: "'Big Shoulders Display', cursive", weight: 900, desc: 'Extra tall · Very bold · High energy' },
    { name: 'Fjalla One', family: "'Fjalla One', sans-serif", weight: 400, desc: 'Condensed · Softer edges · Approachable' },
    { name: 'Stint Ultra Condensed', family: "'Stint Ultra Condensed', cursive", weight: 400, desc: 'Extremely narrow · Dramatic · Unique' },
  ]

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px 48px 48px', background: '#FAF6F1' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Logo Font Options</h1>
      <p style={{ fontSize: 13, color: '#7A6555', marginBottom: 40, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Pick the one you like and let me know the number.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {fonts.map((f, i) => (
          <div key={f.name} style={{ background: '#fff', border: '1.5px solid #E8DDD4', borderRadius: 16, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#7A6555', fontFamily: 'Plus Jakarta Sans, sans-serif', width: 20 }}>{i + 1}</span>
              <span style={{ fontFamily: f.family, fontWeight: f.weight, fontSize: 36, color: '#1A1209', letterSpacing: '-0.5px' }}>
                Carry<span style={{ color: '#E8601C' }}>Karo</span>
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1209', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{f.name}</div>
              <div style={{ fontSize: 12, color: '#7A6555', fontFamily: 'Plus Jakarta Sans, sans-serif', marginTop: 2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
