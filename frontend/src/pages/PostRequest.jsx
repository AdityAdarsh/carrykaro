import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { CITIES, ITEM_TYPES } from '../lib/utils'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function PostRequest() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ from_city: '', to_city: '', needed_by_date: '', item_type: '', weight_kg: '', description: '', price_range_min: '', price_range_max: '' })
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

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
    setLoading(true)
    const photo_urls = await uploadPhotos()
    await api.post('/requests', { ...form, weight_kg: parseFloat(form.weight_kg), price_range_min: parseInt(form.price_range_min), price_range_max: parseInt(form.price_range_max), photo_urls })
    navigate('/browse')
  }

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Post a delivery request</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 32 }}>Travellers on this corridor will see it and offer to carry.</p>

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

          <Input label="Needed by" name="needed_by_date" type="date" value={form.needed_by_date} onChange={e => set('needed_by_date', e.target.value)} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="label">Item type</label>
              <select className="input" value={form.item_type} onChange={e => set('item_type', e.target.value)} required>
                <option value="">Select type</option>
                {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <Input label="Weight (kg)" name="weight_kg" type="number" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="e.g. 1.5" required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is it? Any handling notes?" required style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Min price (₹)" name="price_range_min" type="number" value={form.price_range_min} onChange={e => set('price_range_min', e.target.value)} required />
            <Input label="Max price (₹)" name="price_range_max" type="number" value={form.price_range_max} onChange={e => set('price_range_max', e.target.value)} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label">Photos (optional, 1–2)</label>
            <input type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files).slice(0, 2))} style={{ fontSize: 13 }} />
          </div>

          <Button type="submit" disabled={loading}>{loading ? 'Posting…' : 'Post request'}</Button>
        </form>
      </div>
    </main>
  )
}
