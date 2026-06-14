import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { CITIES } from '../lib/utils'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import LoadingPage from '../components/ui/LoadingPage'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }
  const [profile, setProfile] = useState(null)
  const [contactEdit, setContactEdit] = useState(false)
  const [contact, setContact] = useState({ phone: '' })
  const [countryCode, setCountryCode] = useState('+91')

  const COUNTRY_CODES = [
    { code: '+91', label: '🇮🇳 +91' },
    { code: '+1',  label: '🇺🇸 +1' },
    { code: '+44', label: '🇬🇧 +44' },
    { code: '+61', label: '🇦🇺 +61' },
    { code: '+971', label: '🇦🇪 +971' },
    { code: '+65', label: '🇸🇬 +65' },
    { code: '+60', label: '🇲🇾 +60' },
  ]
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users/profile').then(p => {
      setProfile(p)
      setContact({ phone: p.phone || '' })
    }).catch((err) => {
      if (err.message === 'Profile not found') navigate('/onboarding')
    })
  }, [])

  const saveContact = async () => {
    setSaving(true)
    try {
      const codeDigits = countryCode.replace('+', '')
      const normalized = contact.phone
        .replace(/^0+/, '')
        .replace(new RegExp(`^${codeDigits}`), '')
      const payload = {
        ...contact,
        phone: normalized ? `${countryCode}${normalized}` : '',
      }
      const updated = await api.patch('/users/profile', payload)
      setProfile(p => ({ ...p, ...updated }))
      setContactEdit(false)
    } catch {
      // saving failed — button re-enables, user can retry
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <LoadingPage />

  return (
    <main style={{ paddingTop: 80, padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28 }}>Profile</h1>

        <Card>
          {/* Name + city */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.name}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 4 }}>
              {profile.city} · {{ both: 'Sender & Carrier', sender: 'Sender', traveller: 'Carrier' }[profile.role] ?? profile.role}
            </div>
          </div>

          <div className="divider" />

          {/* Contact details */}
          <div style={{ margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-light)' }}>Contact</span>
              {!contactEdit && (
                <button onClick={() => setContactEdit(true)} style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--saffron)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}>Edit</button>
              )}
            </div>

            {contactEdit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="label">Phone</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      className="input"
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      style={{ width: 110, flexShrink: 0 }}
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      type="tel"
                      value={contact.phone}
                      onChange={e => setContact(c => ({ ...c, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="98765 43210"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button onClick={saveContact} disabled={saving} style={{ flex: 1 }}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => { setContactEdit(false); setContact({ phone: profile.phone || '' }) }} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-light)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {profile.phone
                  ? <div>📞 {profile.phone}</div>
                  : <div style={{ color: 'var(--saffron)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setContactEdit(true)}>+ Add phone number</div>
                }
                {profile.email && <div>✉️ {profile.email}</div>}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* KYC notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 10, marginTop: 16,
            background: 'var(--saffron-pale)',
            fontSize: 13, color: 'var(--saffron)', fontWeight: 500,
          }}>
            <span>🔒</span>
            <span>Early Access Beta · You're among the first on CarryKaro. Full verification launches soon.</span>
          </div>

          <div className="divider" style={{ marginTop: 20 }} />

          <button
            data-tally-open="ODV0a7"
            data-tally-emoji-text="💬"
            data-tally-emoji-animation="wave"
            data-tally-width="400"
            style={{
              width: '100%', marginTop: 4, padding: '10px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'var(--ink-light)', textAlign: 'center',
            }}
          >
            Send feedback
          </button>

          <div className="divider" />

          <Button onClick={handleSignOut} variant="outline" style={{ width: '100%', marginTop: 4 }}>
            Sign out
          </Button>
        </Card>
      </div>
    </main>
  )
}
