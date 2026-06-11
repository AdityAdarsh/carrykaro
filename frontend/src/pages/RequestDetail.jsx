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
  const [existingTrip, setExistingTrip] = useState(null)
  const [matched, setMatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    api.get(`/requests/${id}`).then(r => {
      setRequest(r)
      posthog.capture('listing_viewed', { listing_type: 'request', listing_id: id, route: `${r.from_city} → ${r.to_city}` })
      api.get(`/trips?from_city=${r.from_city}&to_city=${r.to_city}`).then(trips => {
        const mine = trips.find(t => t.user_id === user?.id && t.status === 'open')
        if (mine) setExistingTrip(mine)
      })
    }).catch(() => navigate('/browse'))
  }, [id, user])

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

  const expressInterest = async (tripId) => {
    setLoading(true)
    setError('')
    try {
      let resolvedTripId = tripId
      if (!resolvedTripId) {
        const stub = await api.post('/trips', {
          from_city: request.from_city,
          to_city: request.to_city,
          travel_date: request.needed_by_date,
          travel_mode: 'other',
          capacity_kg: Math.ceil(request.weight_kg),
          earning_range_min: request.price_range_max,
          earning_range_max: request.price_range_max,
        })
        resolvedTripId = stub.id
      }
      const match = await api.post('/matches', { request_id: id, trip_id: resolvedTripId })
      posthog.capture('match_requested', { request_id: id, trip_id: resolvedTripId, route: `${request.from_city} → ${request.to_city}` })
      setMatched(true)
      setTimeout(() => navigate(`/matches/${match.id}`), 1200)
    } catch (e) {
      setError(e.message)
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

        {!isOwn && request.status === 'open' && (
          <div style={{ marginTop: 24 }}>
            {matched ? (
              <Card style={{ textAlign: 'center', color: 'var(--saffron)', fontWeight: 700 }}>
                Match created! Taking you there…
              </Card>
            ) : existingTrip ? (
              <Card>
                <div style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 12 }}>
                  You already have a trip on this route
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {existingTrip.from_city} → {existingTrip.to_city}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>
                  {existingTrip.travel_mode} · {existingTrip.capacity_kg}kg free · {formatDate(existingTrip.travel_date)}
                </div>
                {error && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <Button onClick={() => expressInterest(existingTrip.id)} disabled={loading}>
                  {loading ? 'Creating match…' : 'Match using this trip'}
                </Button>
              </Card>
            ) : (
              <Card>
                {error && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <Button onClick={() => expressInterest(null)} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Creating match…' : 'I can carry this'}
                </Button>
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
