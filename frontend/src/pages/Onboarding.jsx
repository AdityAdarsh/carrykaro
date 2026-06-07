import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CITIES } from '../lib/utils'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Onboarding() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', city: '', role: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.post('/users/profile', form)
      navigate('/browse')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px var(--page-px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>One quick setup</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 28 }}>You can change everything later.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Your name" name="name" value={form.name} onChange={e => set('name', e.target.value)} required />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label">Your city</label>
            <select className="input" value={form.city} onChange={e => set('city', e.target.value)} required>
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="label">I want to</label>
            <div className="grid-2" style={{ gap: 12 }}>
              {[
                { value: 'sender', label: 'Send packages', desc: 'Find travellers for my items' },
                { value: 'traveller', label: 'Carry &amp; earn', desc: 'Deliver on my existing trips' },
              ].map(opt => (
                <div key={opt.value} onClick={() => set('role', opt.value)} style={{
                  padding: 16, borderRadius: 12, border: `2px solid ${form.role === opt.value ? 'var(--saffron)' : 'var(--border)'}`,
                  cursor: 'pointer', background: form.role === opt.value ? 'var(--saffron-pale)' : 'var(--white)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: opt.label }} />
                  <div style={{ fontSize: 12, color: 'var(--ink-light)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--error, #e53e3e)', margin: 0 }}>{error}</p>
          )}

          <Button type="submit" disabled={loading || !form.role}>
            {loading ? 'Setting up…' : 'Get started →'}
          </Button>
        </form>
      </div>
    </main>
  )
}
