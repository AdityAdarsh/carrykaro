import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { CITIES, ITEM_TYPES } from '../lib/utils'
import posthog from '../lib/posthog'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const WEIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const today = new Date().toISOString().split('T')[0]

export default function PostRequest() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ from_city: '', to_city: '', needed_by_date: '', item_type: '', weight_kg: '', description: '', price_range_max: '' })
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const sameCities = form.from_city && form.to_city && form.from_city === form.to_city

  const validate = () => {
    const e = {}
    if (form.needed_by_date && form.needed_by_date < today) e.needed_by_date = 'Date must be today or later'
    if (parseInt(form.price_range_max) < 1) e.price_range_max = 'Budget must be at least ₹1'
    return e
  }

  const uploadPhotos = async () => {
    const urls = []
    for (const file of photos) {
      const { data, error } = await supabase.storage.from('item-photos').upload(`${Date.now()}-${file.name}`, file)
      if (!error) urls.push(supabase.storage.from('item-photos').getPublicUrl(data.path).data.publicUrl)
    }
    return urls
  }

  const submit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    const photo_urls = await uploadPhotos()
    const budget = parseInt(form.price_range_max)
    await api.post('/requests', {
      ...form,
      weight_kg: parseFloat(form.weight_kg),
      price_range_min: budget,
      price_range_max: budget,
      photo_urls,
    })
    posthog.capture('request_posted', { from_city: form.from_city, to_city: form.to_city, item_type: form.item_type })
    navigate('/browse')
  }

  const err = (k) => errors[k] ? (
    <span style={{ fontSize: 12, color: 'var(--error, #e53e3e)', marginTop: 2 }}>{errors[k]}</span>
  ) : null

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Post a delivery request</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 32 }}>Travellers on this corridor will see it and offer to carry.</p>

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input label="Needed by" name="needed_by_date" type="date" value={form.needed_by_date} onChange={e => { set('needed_by_date', e.target.value); setErrors(ev => ({ ...ev, needed_by_date: null })) }} required min={today} />
            {err('needed_by_date')}
          </div>

          <div className="grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="label">Item type</label>
              <select className="input" value={form.item_type} onChange={e => set('item_type', e.target.value)} required>
                <option value="">Select type</option>
                {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="label">Weight</label>
              <select className="input" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} required>
                <option value="">Select weight</option>
                {WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w} kg</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is it? Any handling notes?" required style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input label="Budget (₹)" name="price_range_max" type="number" value={form.price_range_max} onChange={e => { set('price_range_max', e.target.value); setErrors(ev => ({ ...ev, price_range_max: null })) }} placeholder="e.g. 400" required min="1" />
            {err('price_range_max')}
          </div>

          {/* Photo upload hidden — re-enable with browser-image-compression in Phase 2
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label">Photos (optional, up to 2)</label>
            <input type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files).slice(0, 2))} style={{ fontSize: 13 }} />
          </div>
          */}

          <Button type="submit" disabled={loading || sameCities}>
            {loading ? 'Posting…' : 'Post request'}
          </Button>
        </form>
      </div>
    </main>
  )
}
