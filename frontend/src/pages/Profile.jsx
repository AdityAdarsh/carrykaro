import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { CITIES } from '../lib/utils'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [contactEdit, setContactEdit] = useState(false)
  const [contact, setContact] = useState({ phone: '', email: '' })
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
      setContact({ phone: p.phone || '', email: p.email || '' })
    }).catch((err) => {
      if (err.message === 'Profile not found') navigate('/onboarding')
    })
  }, [])

  const saveContact = async () => {
    setSaving(true)
    const codeDigits = countryCode.replace('+', '')
    const normalized = contact.phone
      .replace(/^0+/, '')                              // strip leading zeros
      .replace(new RegExp(`^${codeDigits}`), '')       // strip country code if user typed it
    const payload = {
      ...contact,
      phone: normalized ? `${countryCode}${normalized}` : '',
    }
    const updated = await api.patch('/users/profile', payload)
    setProfile(p => ({ ...p, ...updated }))
    setContactEdit(false)
    setSaving(false)
  }

  if (!profile) return <main style={{ paddingTop: 80, padding: '80px var(--page-px)' }}><p style={{ color: 'var(--ink-light)' }}>Loading…</p></main>

  return (
    <main style={{ paddingTop: 80, padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28 }}>Profile</h1>

        <Card>
          {/* Name + city */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.name}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 4 }}>{profile.city} · {profile.role}</div>
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
                <Input label="Email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} placeholder="you@example.com" />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button onClick={saveContact} disabled={saving} style={{ flex: 1 }}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <button onClick={() => { setContactEdit(false); setContact({ phone: profile.phone || '', email: profile.email || '' }) }} style={{
                    flex: 1, padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--border)',
                    background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--ink-light)',
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-light)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {profile.phone
                  ? <div>📞 {profile.phone}</div>
                  : <div style={{ color: 'var(--saffron)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setContactEdit(true)}>+ Add phone number</div>
                }
                {profile.email
                  ? <div>✉️ {profile.email}</div>
                  : <div style={{ color: 'var(--saffron)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setContactEdit(true)}>+ Add email address</div>
                }
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
            <span>KYC verification coming soon — required to send or carry packages.</span>
          </div>
        </Card>
      </div>
    </main>
  )
}
