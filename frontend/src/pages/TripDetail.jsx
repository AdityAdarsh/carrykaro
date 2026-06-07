import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [myRequests, setMyRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matched, setMatched] = useState(false)

  useEffect(() => {
    api.get(`/trips/${id}`).then(setTrip).catch(() => navigate('/browse'))
    api.get('/requests').then(requests => {
      const mine = requests.filter(r => r.user_id === user?.id && r.status === 'open')
      setMyRequests(mine)
      if (mine.length > 0) setSelectedRequest(mine[0].id)
    })
  }, [id, user])

  const expressInterest = async () => {
    if (!selectedRequest) return
    setLoading(true)
    setError('')
    try {
      const match = await api.post('/matches', { request_id: selectedRequest, trip_id: id })
      setMatched(true)
      setTimeout(() => navigate(`/matches/${match.id}`), 1200)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

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
            <Detail label="Earning range" value={`₹${trip.earning_range_min}–${trip.earning_range_max}`} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 13, color: 'var(--ink-light)' }}>
            Posted by <strong style={{ color: 'var(--ink)' }}>{trip.users?.name}</strong> · {trip.users?.city}
          </div>
        </Card>

        {trip.status === 'open' && (
          <div style={{ marginTop: 24, background: 'var(--saffron)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Need to send something?</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Send a package on this trip</div>
            </div>
            <button onClick={() => navigate('/post-request')} style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--saffron)', whiteSpace: 'nowrap', marginLeft: 16 }}>
              Send a package →
            </button>
          </div>
        )}

        {!isOwn && trip.status === 'open' && (
          <div style={{ marginTop: 16 }}>
            {matched ? (
              <Card style={{ textAlign: 'center', color: 'var(--saffron)', fontWeight: 700 }}>
                Match created! Taking you there…
              </Card>
            ) : myRequests.length === 0 ? (
              <Card>
                <p style={{ fontSize: 14, color: 'var(--ink-mid)', marginBottom: 16 }}>
                  You need an open delivery request to send something on this trip.
                </p>
                <Button onClick={() => navigate('/post-request')}>Post a request →</Button>
              </Card>
            ) : (
              <Card>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Send something on this trip</h2>
                <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 16 }}>Select which of your requests matches this route.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {myRequests.map(r => (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                      <input type="radio" name="request" value={r.id} checked={selectedRequest === r.id} onChange={() => setSelectedRequest(r.id)} />
                      {r.from_city} → {r.to_city} · {r.item_type} · {r.weight_kg}kg · by {formatDate(r.needed_by_date)}
                    </label>
                  ))}
                </div>
                {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <Button onClick={expressInterest} disabled={loading || !selectedRequest}>
                  {loading ? 'Sending…' : 'Express interest'}
                </Button>
              </Card>
            )}
          </div>
        )}

        {isOwn && (
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--ink-light)', textAlign: 'center' }}>This is your trip.</p>
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
