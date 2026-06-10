import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import posthog from '../lib/posthog'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [myTrips, setMyTrips] = useState([])
  const [selectedTrip, setSelectedTrip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matched, setMatched] = useState(false)

  useEffect(() => {
    api.get(`/requests/${id}`).then(r => {
      setRequest(r)
      posthog.capture('listing_viewed', { listing_type: 'request', listing_id: id, route: `${r.from_city} → ${r.to_city}` })
    }).catch(() => navigate('/browse'))
    api.get('/trips').then(trips => {
      const mine = trips.filter(t => t.user_id === user?.id && t.status === 'open')
      setMyTrips(mine)
      if (mine.length > 0) setSelectedTrip(mine[0].id)
    })
  }, [id, user])

  const expressInterest = async () => {
    if (!selectedTrip) return
    setLoading(true)
    setError('')
    try {
      const match = await api.post('/matches', { request_id: id, trip_id: selectedTrip })
      posthog.capture('match_requested', { request_id: id, trip_id: selectedTrip, route: `${request.from_city} → ${request.to_city}` })
      setMatched(true)
      setTimeout(() => navigate(`/matches/${match.id}`), 1200)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

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

        {request.status === 'open' && (
          <div style={{ marginTop: 24, background: 'var(--saffron)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Travelling this route?</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Carry this package and earn money</div>
            </div>
            <button onClick={() => navigate('/post-trip')} style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--saffron)', whiteSpace: 'nowrap', marginLeft: 16 }}>
              Carry a package →
            </button>
          </div>
        )}

        {!isOwn && request.status === 'open' && (
          <div style={{ marginTop: 16 }}>
            {matched ? (
              <Card style={{ textAlign: 'center', color: 'var(--saffron)', fontWeight: 700 }}>
                Match created! Taking you there…
              </Card>
            ) : myTrips.length === 0 ? (
              <Card>
                <p style={{ fontSize: 14, color: 'var(--ink-mid)', marginBottom: 16 }}>
                  You need an active trip to carry this. Post your trip first.
                </p>
                <Button onClick={() => navigate(`/post-trip`)}>Post a trip →</Button>
              </Card>
            ) : (
              <Card>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>I can carry this</h2>
                <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 16 }}>Select which of your trips matches this route.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {myTrips.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                      <input type="radio" name="trip" value={t.id} checked={selectedTrip === t.id} onChange={() => setSelectedTrip(t.id)} />
                      {t.from_city} → {t.to_city} · {formatDate(t.travel_date)} · {t.capacity_kg}kg free
                    </label>
                  ))}
                </div>
                {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <Button onClick={expressInterest} disabled={loading || !selectedTrip}>
                  {loading ? 'Sending…' : 'Express interest'}
                </Button>
              </Card>
            )}
          </div>
        )}

        {isOwn && (
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--ink-light)', textAlign: 'center' }}>This is your request.</p>
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
