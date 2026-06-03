import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` })
    if (error) { setError(error.message); setLoading(false); return }
    setStep('otp')
    setLoading(false)
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: otp,
      type: 'sms',
    })
    if (error) { setError(error.message); setLoading(false); return }
    // Check if profile exists
    const { data: profile } = await supabase.from('users').select('id').eq('id', data.user.id).single()
    navigate(profile ? '/browse' : '/onboarding')
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/browse` } })
  }

  return (
    <main style={{ paddingTop: 60, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Sign in</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 28 }}>Phone OTP or Google — your choice.</p>

        {step === 'phone' ? (
          <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--ink-mid)', background: 'var(--saffron-pale)' }}>+91</span>
              <input className="input" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} required />
            </div>
            {error && <p style={{ fontSize: 13, color: '#CC3333' }}>{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Enter OTP" name="otp" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" required />
            {error && <p style={{ fontSize: 13, color: '#CC3333' }}>{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify OTP'}</Button>
            <button type="button" onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: 'var(--ink-light)', fontSize: 13, cursor: 'pointer' }}>← Change number</button>
          </form>
        )}

        <div className="divider" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>or</span>
        </div>

        <button onClick={signInWithGoogle} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
          Continue with Google
        </button>
      </div>
    </main>
  )
}
