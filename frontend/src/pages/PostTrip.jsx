import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CITIES, TRAVEL_MODES } from '../lib/utils'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function PostTrip() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ from_city: '', to_city: '', travel_date: '', travel_mode: '', capacity_kg: '', earning_range_min: '', earning_range_max: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await api.post('/trips/', { ...form, capacity_kg: parseFloat(form.capacity_kg), earning_range_min: parseInt(form.earning_range_min), earning_range_max: parseInt(form.earning_range_max) })
    navigate('/browse')
  }

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Post a trip</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 32 }}>You're already going — earn by carrying something.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Travel date" name="travel_date" type="date" value={form.travel_date} onChange={e => set('travel_date', e.target.value)} required />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="label">Travel mode</label>
              <select className="input" value={form.travel_mode} onChange={e => set('travel_mode', e.target.value)} required>
                <option value="">Select mode</option>
                {TRAVEL_MODES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <Input label="Spare capacity (kg)" name="capacity_kg" type="number" value={form.capacity_kg} onChange={e => set('capacity_kg', e.target.value)} placeholder="e.g. 5" required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Min earning (₹)" name="earning_range_min" type="number" value={form.earning_range_min} onChange={e => set('earning_range_min', e.target.value)} required />
            <Input label="Max earning (₹)" name="earning_range_max" type="number" value={form.earning_range_max} onChange={e => set('earning_range_max', e.target.value)} required />
          </div>

          <Button type="submit" disabled={loading}>{loading ? 'Posting…' : 'Post trip'}</Button>
        </form>
      </div>
    </main>
  )
}
