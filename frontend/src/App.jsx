import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
  return (
    <button
      data-tally-open="ODV0a7"
      data-tally-emoji-text="💬"
      data-tally-emoji-animation="wave"
      data-tally-width="400"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
        background: 'var(--saffron)', color: '#fff',
        border: 'none', borderRadius: 24, padding: '10px 18px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(232,96,28,0.35)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
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
      </Routes>
    </BrowserRouter>
  )
}
