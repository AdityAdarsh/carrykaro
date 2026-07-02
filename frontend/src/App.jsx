import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Nav from './components/Nav'
import Home from './pages/Home'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Browse from './pages/Browse'
import PostRequest from './pages/PostRequest'
import PostTrip from './pages/PostTrip'
import ChatPage from './pages/ChatPage'
import MessagesPage from './pages/MessagesPage'
import Profile from './pages/Profile'
import RequestDetail from './pages/RequestDetail'
import TripDetail from './pages/TripDetail'
import ButtonPreview from './pages/ButtonPreview'

function NotFound() {
  return (
    <main style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px var(--page-px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Page not found</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 24 }}>This route doesn't exist.</p>
        <a href="/browse" className="btn btn-primary">Back to Browse</a>
      </div>
    </main>
  )
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/browse" replace />
  return <Home />
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function FeedbackButton() {
  const { pathname } = useLocation()
  if (pathname !== '/browse') return null
  return (
    <button
      data-tally-open="ODV0a7"
      data-tally-emoji-text="💬"
      data-tally-emoji-animation="wave"
      data-tally-width="400"
      className="feedback-btn"
    >
      💬 Feedback
    </button>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <FeedbackButton />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
        <Route path="/post-request" element={<ProtectedRoute><PostRequest /></ProtectedRoute>} />
        <Route path="/post-trip" element={<ProtectedRoute><PostTrip /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
        <Route path="/trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
<Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/chat/:matchId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/button-preview" element={<ButtonPreview />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
