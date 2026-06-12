import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import posthog from '../lib/posthog'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LoadingPage from '../components/ui/LoadingPage'

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [existingRequest, setExistingRequest] = useState(null)
  const [matched, setMatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    api.get(`/trips/${id}`).then(t => {
      setTrip(t)
      posthog.capture('listing_viewed', { listing_type: 'trip', listing_id: id, route: `${t.from_city} → ${t.to_city}` })
      api.get(`/requests?from_city=${t.from_city}&to_city=${t.to_city}`).then(requests => {
        const mine = requests.find(r => r.user_id === user?.id && r.status === 'open')
        if (mine) setExistingRequest(mine)
      })
    }).catch(() => navigate('/browse'))
  }, [id, user])

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

  const expressInterest = async (requestId) => {
    setLoading(true)
    setError('')
    try {
      let resolvedRequestId = requestId
      if (!resolvedRequestId) {
        const stub = await api.post('/requests', {
          from_city: trip.from_city,
          to_city: trip.to_city,
          needed_by_date: trip.travel_date,
          item_type: 'other',
          weight_kg: 1,
          description: '',
          price_range_min: trip.earning_range_min,
          price_range_max: trip.earning_range_min,
          photo_urls: [],
          is_stub: true,
        })
        resolvedRequestId = stub.id
      }
      const match = await api.post('/matches', { request_id: resolvedRequestId, trip_id: id })
      posthog.capture('match_requested', { request_id: resolvedRequestId, trip_id: id, route: `${trip.from_city} → ${trip.to_city}` })
      setMatched(true)
      setTimeout(() => navigate(`/chat/${match.id}`), 1200)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  if (!trip) return <LoadingPage />

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

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 13, color: 'var(--ink-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Posted by <strong style={{ color: 'var(--ink)' }}>{trip.users?.name}</strong> · {trip.users?.city}</span>
            {trip.match_count > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', background: 'var(--green-light)', borderRadius: 6, padding: '2px 8px' }}>
                {trip.match_count} interested
              </span>
            )}
          </div>
        </Card>

        {!isOwn && trip.status === 'open' && (
          <div style={{ marginTop: 24 }}>
            {matched ? (
              <Card style={{ textAlign: 'center', color: 'var(--saffron)', fontWeight: 700 }}>
                Match created! Taking you there…
              </Card>
            ) : existingRequest ? (
              <Card>
                <div style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 12 }}>
                  You already have a request on this route
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {existingRequest.from_city} → {existingRequest.to_city}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>
                  {existingRequest.item_type} · {existingRequest.weight_kg}kg · by {formatDate(existingRequest.needed_by_date)}
                </div>
                {error && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <Button onClick={() => expressInterest(existingRequest.id)} disabled={loading}>
                  {loading ? 'Creating match…' : 'Match using this request'}
                </Button>
              </Card>
            ) : (
              <Card>
                {error && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <Button onClick={() => expressInterest(null)} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Creating match…' : 'I want to send via this trip'}
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
