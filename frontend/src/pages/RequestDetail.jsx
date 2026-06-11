import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, TRAVEL_MODES } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import posthog from '../lib/posthog'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const CAPACITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const today = new Date().toISOString().split('T')[0]

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [matched, setMatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [tripForm, setTripForm] = useState({ travel_date: '', travel_mode: '', capacity_kg: '', earning_range_min: '' })

  useEffect(() => {
    api.get(`/requests/${id}`).then(r => {
      setRequest(r)
      setTripForm(f => ({ ...f, earning_range_min: r.price_range_max ?? '' }))
      posthog.capture('listing_viewed', { listing_type: 'request', listing_id: id, route: `${r.from_city} → ${r.to_city}` })
    }).catch(() => navigate('/browse'))
  }, [id])

  const deleteRequest = async () => {
    if (!window.confirm('Delete this request? This cannot be undone.')) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/requests/${id}`)
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
      const minEarning = parseInt(tripForm.earning_range_min)
      const trip = await api.post('/trips', {
        from_city: request.from_city,
        to_city: request.to_city,
        travel_date: tripForm.travel_date,
        travel_mode: tripForm.travel_mode,
        capacity_kg: parseFloat(tripForm.capacity_kg),
        earning_range_min: minEarning,
        earning_range_max: minEarning,
      })
      const match = await api.post('/matches', { request_id: id, trip_id: trip.id })
      posthog.capture('match_requested', { request_id: id, trip_id: trip.id, route: `${request.from_city} → ${request.to_city}` })
      setMatched(true)
      setTimeout(() => navigate(`/matches/${match.id}`), 1200)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const set = (k, v) => setTripForm(f => ({ ...f, [k]: v }))

  if (!request) return <main style={{ paddingTop: 120, textAlign: 'center', color: 'var(--ink-light)' }}>Loading…</main>

  const isOwn = request.user_id === user?.id

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => navigate('/browse')} style={{ background: 'none', border: 'none', color: 'var(--ink-light)', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}>
          ← Back to browse
        </button>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{request.from_city} → {request.to_city}</h1>
            <StatusBadge status={request.status} />
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            <Detail label="Item type" value={request.item_type} />
            <Detail label="Weight" value={`${request.weight_kg} kg`} />
            <Detail label="Needed by" value={formatDate(request.needed_by_date)} />
            <Detail label="Budget" value={`₹${request.price_range_max}`} />
          </div>

          {request.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Description</div>
              <p style={{ fontSize: 14, color: 'var(--ink-mid)' }}>{request.description}</p>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 13, color: 'var(--ink-light)' }}>
            Posted by <strong style={{ color: 'var(--ink)' }}>{request.users?.name}</strong> · {request.users?.city}
          </div>
        </Card>

        {!isOwn && request.status === 'open' && (
          <div style={{ marginTop: 24 }}>
            {matched ? (
              <Card style={{ textAlign: 'center', color: 'var(--saffron)', fontWeight: 700 }}>
                Match created! Taking you there…
              </Card>
            ) : (
              <Card>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>I can carry this</h2>
                <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>
                  Tell us about your trip on the {request.from_city} → {request.to_city} route.
                </p>

                <form onSubmit={expressInterest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Travel date</label>
                      <input type="date" className="input" value={tripForm.travel_date} onChange={e => set('travel_date', e.target.value)} required min={today} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Travel mode</label>
                      <select className="input" value={tripForm.travel_mode} onChange={e => set('travel_mode', e.target.value)} required>
                        <option value="">Select mode</option>
                        {TRAVEL_MODES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Spare capacity</label>
                      <select className="input" value={tripForm.capacity_kg} onChange={e => set('capacity_kg', e.target.value)} required>
                        <option value="">Select capacity</option>
                        {CAPACITY_OPTIONS.map(w => <option key={w} value={w}>{w} kg</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="label">Min earning (₹)</label>
                      <input type="number" className="input" value={tripForm.earning_range_min} onChange={e => set('earning_range_min', e.target.value)} placeholder="e.g. 200" required min="1" />
                    </div>
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
            <button onClick={deleteRequest} disabled={deleting} style={{
              width: '100%', padding: '10px 16px', borderRadius: 10,
              border: '1.5px solid #e53e3e', background: 'none',
              color: '#e53e3e', fontSize: 14, fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
            }}>
              {deleting ? 'Deleting…' : 'Delete request'}
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
