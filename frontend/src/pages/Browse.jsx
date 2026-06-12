import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CITIES, formatDate } from '../lib/utils'
import posthog from '../lib/posthog'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'

const STATUS_LABEL = {
  open: { label: 'Open', color: 'var(--green)', bg: 'var(--green-light)' },
  matched: { label: 'Matched', color: '#b45309', bg: '#fef3c7' },
  cancelled: { label: 'Cancelled', color: '#9ca3af', bg: '#f3f4f6' },
  completed: { label: 'Completed', color: '#6366f1', bg: '#eef2ff' },
}

export default function Browse() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('requests') // 'requests' | 'trips' | 'mine'
  const [requests, setRequests] = useState([])
  const [trips, setTrips] = useState([])
  const [myListings, setMyListings] = useState([])
  const [myListingsLoading, setMyListingsLoading] = useState(false)
  const [filters, setFilters] = useState({ from_city: '', to_city: '' })
  const [alertForm, setAlertForm] = useState({ open: false, from_city: '', to_city: '', submitted: false, loading: false, error: null })
  const [routeDemand, setRouteDemand] = useState(null)

  const items = tab === 'requests' ? requests : trips

  useEffect(() => {
    api.get('/users/profile').catch(err => {
      if (err.message === 'Profile not found') navigate('/onboarding')
    })
  }, [])

  useEffect(() => {
    if (tab === 'mine') {
      setMyListingsLoading(true)
      api.get('/users/listings').then(data => {
        setMyListings(data)
        setMyListingsLoading(false)
      }).catch(() => setMyListingsLoading(false))
      return
    }
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v))
    if (tab === 'requests') {
      api.get(`/requests?${params}`).then(setRequests)
    } else {
      api.get(`/trips?${params}`).then(setTrips)
    }
    setAlertForm({ open: false, from_city: '', to_city: '', submitted: false, loading: false })
    setRouteDemand(null)
  }, [tab, filters])

  useEffect(() => {
    if (tab === 'mine' || items.length > 0 || !filters.from_city || !filters.to_city) return
    const looking_for = tab === 'requests' ? 'request' : 'trip'
    api.get(`/route-alerts/demand?from_city=${filters.from_city}&to_city=${filters.to_city}&looking_for=${looking_for}`)
      .then(data => setRouteDemand(data.count))
      .catch(() => {})
  }, [items, filters, tab])

  const markAsMatched = async (item) => {
    const endpoint = item.type === 'trip' ? `/trips/${item.id}/status` : `/requests/${item.id}/status`
    await api.patch(endpoint, { status: 'matched' })
    setMyListings(prev => prev.map(l => l.id === item.id ? { ...l, status: 'matched' } : l))
  }

  const deleteMyListing = async (item) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return
    const endpoint = item.type === 'trip' ? `/trips/${item.id}` : `/requests/${item.id}`
    await api.delete(endpoint)
    setMyListings(prev => prev.filter(l => l.id !== item.id))
  }

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Browse</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 32 }}>Find delivery requests or travellers with spare capacity.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1.5px solid var(--border)' }}>
          {[
            { key: 'requests', label: 'Delivery Requests' },
            { key: 'trips', label: 'Trips with Space' },
            { key: 'mine', label: 'My Listings' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 24px', background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--saffron)' : '2px solid transparent',
              color: tab === t.key ? 'var(--saffron)' : 'var(--ink-light)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: -1.5,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* My Listings tab */}
        {tab === 'mine' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {myListingsLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--ink-light)', padding: 40 }}>Loading…</div>
            ) : myListings.length === 0 ? (
              <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No listings yet</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 24 }}>
                  Post a delivery request or a trip with spare capacity.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/post-request')}>Post a request</button>
                  <button className="btn btn-outline" onClick={() => navigate('/post-trip')}>Post a trip</button>
                </div>
              </Card>
            ) : myListings.map(item => {
              const s = STATUS_LABEL[item.status] || STATUS_LABEL.open
              const isRequest = item.type === 'request'
              return (
                <Card key={item.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-light)' }}>
                          {isRequest ? 'Request' : 'Trip'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{item.from_city} → {item.to_city}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 2 }}>
                        {isRequest
                          ? `${item.item_type} · ${item.weight_kg}kg · by ${formatDate(item.needed_by_date)}`
                          : `${item.travel_mode} · ${item.capacity_kg}kg free · ${formatDate(item.travel_date)}`}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--saffron)' }}>
                      {isRequest ? `Budget: ₹${item.price_range_max}` : `Earn ₹${item.earning_range_min}+`}
                    </span>
                    {item.match_count > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', background: 'var(--green-light)', borderRadius: 6, padding: '2px 8px' }}>
                        {item.match_count} interested
                      </span>
                    )}
                  </div>

                  {item.status === 'open' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => markAsMatched(item)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--saffron)', background: 'none', color: 'var(--saffron)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark as matched
                      </button>
                      <button
                        onClick={() => deleteMyListing(item)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e53e3e', background: 'none', color: '#e53e3e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="browse-filters">
              {['from_city', 'to_city'].map(key => (
                <select key={key} className="input" value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}>
                  <option value="">{key === 'from_city' ? 'From city' : 'To city'}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ))}
            </div>

            {/* Items */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {items.map(item => (
                <Card key={item.id} onClick={() => {
                  posthog.capture('listing_clicked', { listing_type: tab === 'requests' ? 'request' : 'trip', listing_id: item.id, route: `${item.from_city} → ${item.to_city}` })
                  navigate(tab === 'requests' ? `/requests/${item.id}` : `/trips/${item.id}`)
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{item.from_city} → {item.to_city}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 2 }}>
                      {tab === 'requests' ? `${item.item_type} · ${item.weight_kg}kg · by ${formatDate(item.needed_by_date)}` : `${item.travel_mode} · ${item.capacity_kg}kg free · ${formatDate(item.travel_date)}`}
                    </div>
                  </div>
                  {tab === 'requests' && item.description && (
                    <p style={{ fontSize: 13, color: 'var(--ink-mid)', marginBottom: 12 }}>"{item.description}"</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--saffron)' }}>
                      {tab === 'requests' ? `Budget: ₹${item.price_range_max}` : `Earn ₹${item.earning_range_min}+`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.match_count > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', background: 'var(--green-light)', borderRadius: 6, padding: '2px 8px' }}>
                          {item.match_count} interested
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{item.users?.name}</span>
                    </div>
                  </div>
                </Card>
              ))}
              {items.length === 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  {filters.from_city || filters.to_city ? (
                    <Card style={{ textAlign: 'center', padding: '32px 24px' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                        No {tab === 'requests' ? 'delivery requests' : 'trips'} on this route yet
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: routeDemand > 0 ? 12 : 24, maxWidth: 360, margin: `0 auto ${routeDemand > 0 ? '12px' : '24px'}` }}>
                        Be the first to know when someone posts on this corridor.
                      </p>
                      {routeDemand > 0 && (
                        <p style={{ fontSize: 13, color: 'var(--saffron)', fontWeight: 600, marginBottom: 20 }}>
                          {routeDemand} {routeDemand === 1 ? 'person is' : 'people are'} already waiting for this route
                        </p>
                      )}
                      {alertForm.submitted ? (
                        <div style={{ color: 'var(--saffron)', fontWeight: 600, fontSize: 15 }}>
                          ✓ We'll notify you when a {tab === 'requests' ? 'request' : 'trip'} is posted here.
                        </div>
                      ) : alertForm.open ? (
                        <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div className="grid-2" style={{ gap: 10 }}>
                            {['from_city', 'to_city'].map(key => (
                              <select key={key} className="input" value={alertForm[key]} onChange={e => setAlertForm(f => ({ ...f, [key]: e.target.value }))}>
                                <option value="">{key === 'from_city' ? 'From city' : 'To city'}</option>
                                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ))}
                          </div>
                          {alertForm.error && (
                            <p style={{ fontSize: 13, color: '#c0392b', textAlign: 'center' }}>{alertForm.error}</p>
                          )}
                          <button
                            disabled={!alertForm.from_city || !alertForm.to_city || alertForm.loading}
                            onClick={async () => {
                              setAlertForm(f => ({ ...f, loading: true, error: null }))
                              try {
                                await api.post('/route-alerts', { from_city: alertForm.from_city, to_city: alertForm.to_city, looking_for: tab === 'requests' ? 'request' : 'trip' })
                                posthog.capture('route_alert_created', { from_city: alertForm.from_city, to_city: alertForm.to_city, looking_for: tab === 'requests' ? 'request' : 'trip' })
                                setAlertForm(f => ({ ...f, submitted: true, loading: false }))
                              } catch {
                                setAlertForm(f => ({ ...f, loading: false, error: 'Something went wrong. Please try again.' }))
                              }
                            }}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            {alertForm.loading ? 'Saving…' : 'Notify me'}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => setAlertForm(f => ({ ...f, open: true, from_city: filters.from_city, to_city: filters.to_city }))}
                        >
                          Notify me when one is posted
                        </button>
                      )}
                    </Card>
                  ) : (
                    <Card style={{ textAlign: 'center', padding: '32px 24px' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                        No {tab === 'requests' ? 'delivery requests' : 'trips'} yet
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 24 }}>
                        Be the first to post on CarryKaro.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(tab === 'requests' ? '/post-request' : '/post-trip')}
                      >
                        {tab === 'requests' ? 'Post a delivery request' : 'Post a trip'}
                      </button>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
