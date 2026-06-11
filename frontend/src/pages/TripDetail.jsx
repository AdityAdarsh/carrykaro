import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, ITEM_TYPES } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import posthog from '../lib/posthog'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const WEIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const today = new Date().toISOString().split('T')[0]

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [matched, setMatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [reqForm, setReqForm] = useState({ item_type: '', weight_kg: '', price_range_max: '', needed_by_date: '', description: '' })

  useEffect(() => {
    api.get(`/trips/${id}`).then(t => {
      setTrip(t)
      setReqForm(f => ({
        ...f,
        price_range_max: t.earning_range_min ?? '',
        needed_by_date: t.travel_date ?? '',
      }))
      posthog.capture('listing_viewed', { listing_type: 'trip', listing_id: id, route: `${t.from_city} → ${t.to_city}` })
    }).catch(() => navigate('/browse'))
  }, [id])

  const deleteTrip = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/trips/${id}`)
      navigate('/browse')
    } catch (e) {
      setDeleteError(e.message)
      setDeleting(false)
    }
  }

  const expressInterest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const budget = parseInt(reqForm.price_range_max)
      const request = await api.post('/requests', {
        from_city: trip.from_city,
        to_city: trip.to_city,
        item_type: reqForm.item_type,
        weight_kg: parseFloat(reqForm.weight_kg),
        needed_by_date: reqForm.needed_by_date,
        description: reqForm.description || '',
        price_range_min: budget,
        price_range_max: budget,
        photo_urls: [],
      })
      const match = await api.post('/matches', { request_id: request.id, trip_id: id })
      posthog.capture('match_requested', { request_id: request.id, trip_id: id, route: `${trip.from_city} → ${trip.to_city}` })
      setMatched(true)
      setTimeout(() => navigate(`/matches/${match.id}`), 1200)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const set = (k, v) => setReqForm(f => ({ ...f, [k]: v }))

  if (!trip) return <main style={{ paddingTop: 120, textAlign: 'center', color: 'var(--ink-light)' }}>Loading…</main>

  const isOwn = trip.user_id === user?.id

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => navigate('/browse')} style={{ background: 'none', border: 'none', color: 'var(--ink-light)', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}>
          ← Back to browse
        </button>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{trip.from_city} → {trip.to_city}</h1>
            <StatusBadge status={trip.status} />
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            <Detail label="Travel date" value={formatDate(trip.travel_date)} />
            <Detail label="Travel mode" value={trip.travel_mode} />
            <Detail label="Spare capacity" value={`${trip.capacity_kg} kg`} />
            <Detail label="Min earning" value={`₹${trip.earning_range_min}+`} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 13, color: 'var(--ink-light)' }}>
            Posted by <strong style={{ color: 'var(--ink)' }}>{trip.users?.name}</strong> · {trip.users?.city}
          </div>
        </Card>

        {!isOwn && trip.status === 'open' && (
          <div style={{ marginTop: 24 }}>
            {matched ? (
              <Card style={{ textAlign: 'center', color: 'var(--saffron)', fontWeight: 700 }}>
                Match created! Taking you there…
              </Card>
            ) : (
              <Card>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>I want to send via this trip</h2>
                <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>
                  Tell us what you need carried on the {trip.from_city} → {trip.to_city} route.
                </p>

                <form onSubmit={expressInterest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Item type</label>
                      <select className="input" value={reqForm.item_type} onChange={e => set('item_type', e.target.value)} required>
                        <option value="">Select type</option>
                        {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Weight</label>
                      <select className="input" value={reqForm.weight_kg} onChange={e => set('weight_kg', e.target.value)} required>
                        <option value="">Select weight</option>
                        {WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w} kg</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Needed by</label>
                      <input type="date" className="input" value={reqForm.needed_by_date} onChange={e => set('needed_by_date', e.target.value)} required min={today} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Budget (₹)</label>
                      <input type="number" className="input" value={reqForm.price_range_max} onChange={e => set('price_range_max', e.target.value)} placeholder="e.g. 300" required min="1" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="label">Description</label>
                    <textarea className="input" rows={2} value={reqForm.description} onChange={e => set('description', e.target.value)} placeholder="What is it? Any handling notes?" required style={{ resize: 'vertical' }} />
                  </div>

                  {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating match…' : 'Express interest'}
                  </Button>
                </form>
              </Card>
            )}
          </div>
        )}

        {isOwn && (
          <div style={{ marginTop: 20 }}>
            {deleteError && (
              <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 10, textAlign: 'center' }}>{deleteError}</p>
            )}
            <button onClick={deleteTrip} disabled={deleting} style={{
              width: '100%', padding: '10px 16px', borderRadius: 10,
              border: '1.5px solid #e53e3e', background: 'none',
              color: '#e53e3e', fontSize: 14, fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
            }}>
              {deleting ? 'Deleting…' : 'Delete trip'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
    </div>
  )
}
