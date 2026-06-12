import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function request(method, path, body, attempt = 1) {
  const headers = await authHeaders()
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401 && attempt === 1) {
      // Try refreshing the session once before giving up
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        await supabase.auth.signOut()
        window.location.href = '/login'
        return
      }
      return request(method, path, body, 2)
    }
    if (res.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/login'
      return
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Request failed')
    }
    return res.json()
  } catch (err) {
    // Only retry on network-level failures (server cold start), not API errors
    if (err instanceof TypeError && attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS)
      return request(method, path, body, attempt + 1)
    }
    throw err
  }
}

export const api = {
  get:    (path)       => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path)       => request('DELETE', path),
}
