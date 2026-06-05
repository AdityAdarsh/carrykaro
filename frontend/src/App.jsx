import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Nav from './components/Nav'
import Home from './pages/Home'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Browse from './pages/Browse'
import PostRequest from './pages/PostRequest'
import PostTrip from './pages/PostTrip'
import MatchPage from './pages/MatchPage'
import ChatPage from './pages/ChatPage'
import Profile from './pages/Profile'
import RequestDetail from './pages/RequestDetail'
import TripDetail from './pages/TripDetail'
import FontPreview from './pages/FontPreview'

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

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
        <Route path="/post-request" element={<ProtectedRoute><PostRequest /></ProtectedRoute>} />
        <Route path="/post-trip" element={<ProtectedRoute><PostTrip /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
        <Route path="/trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
        <Route path="/matches/:matchId" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
        <Route path="/chat/:matchId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/font-preview" element={<FontPreview />} />
      </Routes>
    </BrowserRouter>
  )
}
