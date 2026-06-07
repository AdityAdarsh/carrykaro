import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CITIES, formatDate } from '../lib/utils'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'

export default function Browse() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('requests') // 'requests' | 'trips'
  const [requests, setRequests] = useState([])
  const [trips, setTrips] = useState([])
  const [filters, setFilters] = useState({ from_city: '', to_city: '' })

  useEffect(() => {
    api.get('/users/profile').catch(err => {
      if (err.message === 'Profile not found') navigate('/onboarding')
    })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v))
    if (tab === 'requests') {
      api.get(`/requests?${params}`).then(setRequests)
    } else {
      api.get(`/trips?${params}`).then(setTrips)
    }
  }, [tab, filters])

  const items = tab === 'requests' ? requests : trips

  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Browse</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 32 }}>Find delivery requests or travellers with spare capacity.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1.5px solid var(--border)' }}>
          {['requests', 'trips'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 24px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--saffron)' : '2px solid transparent',
              color: tab === t ? 'var(--saffron)' : 'var(--ink-light)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: -1.5,
            }}>
              {t === 'requests' ? 'Delivery Requests' : 'Trips with Space'}
            </button>
          ))}
        </div>

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
            <Card key={item.id} onClick={() => navigate(tab === 'requests' ? `/requests/${item.id}` : `/trips/${item.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{item.from_city} → {item.to_city}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 2 }}>
                    {tab === 'requests' ? `${item.item_type} · ${item.weight_kg}kg · by ${formatDate(item.needed_by_date)}` : `${item.travel_mode} · ${item.capacity_kg}kg free · ${formatDate(item.travel_date)}`}
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              {tab === 'requests' && item.description && (
                <p style={{ fontSize: 13, color: 'var(--ink-mid)', marginBottom: 12 }}>"{item.description}"</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--saffron)' }}>
                  {tab === 'requests' ? `₹${item.price_range_min}–${item.price_range_max}` : `Earn ₹${item.earning_range_min}–${item.earning_range_max}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{item.users?.name}</span>
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <p style={{ color: 'var(--ink-light)', fontSize: 15 }}>No {tab} found for this corridor yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}
