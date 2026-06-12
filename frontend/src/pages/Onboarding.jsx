import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { CITIES } from '../lib/utils'
import posthog from '../lib/posthog'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const ROLE_OPTIONS = [
  { value: 'sender', label: 'Send packages', desc: 'Find travellers for my items' },
  { value: 'traveller', label: 'Carry & earn', desc: 'Deliver on my existing trips' },
  { value: 'both', label: 'Both', desc: 'Send packages and carry for others' },
]

const FREQ_OPTIONS = [
  { value: 'weekly', label: 'Every week' },
  { value: 'few_times_month', label: '2–3× a month' },
  { value: 'monthly', label: 'Once a month' },
  { value: 'rarely', label: 'Rarely / first time' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', city: '', role: '', travel_frequency: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const googleName = session?.user?.user_metadata?.full_name || ''
      if (googleName) setForm(f => ({ ...f, name: googleName }))
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const needsFrequency = form.role === 'traveller' || form.role === 'both'
  const canSubmit = form.role && (!needsFrequency || form.travel_frequency)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = { name: form.name, city: form.city, role: form.role }
      if (needsFrequency && form.travel_frequency) payload.travel_frequency = form.travel_frequency
      await api.post('/users/profile', payload)
      posthog.capture('role_selected', { role: form.role, travel_frequency: form.travel_frequency || null })
      navigate('/browse')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px var(--page-px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {ROLE_OPTIONS.map(opt => (
                <div key={opt.value} onClick={() => { set('role', opt.value); set('travel_frequency', '') }} style={{
                  padding: 14, borderRadius: 12, border: `2px solid ${form.role === opt.value ? 'var(--saffron)' : 'var(--border)'}`,
                  cursor: 'pointer', background: form.role === opt.value ? 'var(--saffron-pale)' : 'var(--white)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-light)', lineHeight: 1.3 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {needsFrequency && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className="label">How often do you travel between cities?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {FREQ_OPTIONS.map(opt => (
                  <div key={opt.value} onClick={() => set('travel_frequency', opt.value)} style={{
                    padding: '10px 14px', borderRadius: 10, border: `2px solid ${form.travel_frequency === opt.value ? 'var(--saffron)' : 'var(--border)'}`,
                    cursor: 'pointer', background: form.travel_frequency === opt.value ? 'var(--saffron-pale)' : 'var(--white)',
                    fontSize: 13, fontWeight: 500, transition: 'all 0.15s', textAlign: 'center',
                  }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p style={{ fontSize: 13, color: 'var(--error, #e53e3e)', margin: 0 }}>{error}</p>
          )}

          <Button type="submit" disabled={loading || !canSubmit}>
            {loading ? 'Setting up…' : 'Get started →'}
          </Button>
        </form>
      </div>
    </main>
  )
}
