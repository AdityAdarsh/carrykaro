import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CITIES, TRAVEL_MODES } from '../lib/utils'
import posthog from '../lib/posthog'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const CAPACITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const today = new Date().toISOString().split('T')[0]

export default function PostTrip() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ from_city: '', to_city: '', travel_date: '', travel_mode: '', capacity_kg: '', earning_range_min: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const sameCities = form.from_city && form.to_city && form.from_city === form.to_city

  const validate = () => {
    const e = {}
    if (form.travel_date && form.travel_date < today) e.travel_date = 'Travel date must be today or later'
    if (parseInt(form.earning_range_min) < 1) e.earning_range_min = 'Min earning must be at least ₹1'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    const minEarning = parseInt(form.earning_range_min)
    await api.post('/trips', {
      ...form,
      capacity_kg: parseFloat(form.capacity_kg),
      earning_range_min: minEarning,
      earning_range_max: minEarning,
    })
    posthog.capture('trip_posted', { from_city: form.from_city, to_city: form.to_city, travel_mode: form.travel_mode })
    navigate('/browse')
  }

  const err = (k) => errors[k] ? (
    <span style={{ fontSize: 12, color: 'var(--error, #e53e3e)', marginTop: 2 }}>{errors[k]}</span>
  ) : null

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Post a trip</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 32 }}>You're already going — earn by carrying something.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="grid-2">
              {['from_city', 'to_city'].map(key => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="label">{key === 'from_city' ? 'From' : 'To'}</label>
                  <select className="input" value={form[key]} onChange={e => set(key, e.target.value)} required>
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {sameCities && (
              <span style={{ fontSize: 12, color: 'var(--error, #e53e3e)' }}>From and To can't be the same city</span>
            )}
          </div>

          <div className="grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Input label="Travel date" name="travel_date" type="date" value={form.travel_date} onChange={e => { set('travel_date', e.target.value); setErrors(ev => ({ ...ev, travel_date: null })) }} required min={today} />
              {err('travel_date')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="label">Travel mode</label>
              <select className="input" value={form.travel_mode} onChange={e => set('travel_mode', e.target.value)} required>
                <option value="">Select mode</option>
                {TRAVEL_MODES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label">Spare capacity</label>
            <select className="input" value={form.capacity_kg} onChange={e => set('capacity_kg', e.target.value)} required>
              <option value="">Select capacity</option>
              {CAPACITY_OPTIONS.map(w => <option key={w} value={w}>{w} kg</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input label="Min earning (₹)" name="earning_range_min" type="number" value={form.earning_range_min} onChange={e => { set('earning_range_min', e.target.value); setErrors(ev => ({ ...ev, earning_range_min: null })) }} placeholder="e.g. 200" required min="1" />
            {err('earning_range_min')}
          </div>

          <Button type="submit" disabled={loading || sameCities}>
            {loading ? 'Posting…' : 'Post trip'}
          </Button>
        </form>
      </div>
    </main>
  )
}
