import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { CITIES } from '../lib/utils'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    api.get('/users/profile').then(setProfile).catch((err) => {
      if (err.message === 'Profile not found') navigate('/onboarding')
    })
  }, [])

  if (!profile) return <main style={{ paddingTop: 80, padding: '80px var(--page-px)' }}><p style={{ color: 'var(--ink-light)' }}>Loading…</p></main>

  return (
    <main style={{ paddingTop: 80, padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28 }}>Profile</h1>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.name}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 4 }}>{profile.city} · {profile.role}</div>
            </div>
            <span style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: profile.kyc_status === 'verified' ? 'var(--green-light)' : 'var(--saffron-pale)',
              color: profile.kyc_status === 'verified' ? 'var(--green)' : 'var(--saffron)',
            }}>
              KYC: {profile.kyc_status}
            </span>
          </div>

          <div className="divider" />

          <div style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>
            <div>Phone: {profile.phone || '—'}</div>
            <div>Email: {profile.email || '—'}</div>
          </div>

          {profile.kyc_status === 'not_started' && (
            <Button onClick={() => api.post('/kyc/initiate').then(() => setProfile(p => ({ ...p, kyc_status: 'pending' })))}>
              Complete KYC to transact
            </Button>
          )}
        </Card>
      </div>
    </main>
  )
}
