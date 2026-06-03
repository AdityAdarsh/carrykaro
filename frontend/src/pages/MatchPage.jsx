import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function MatchPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)

  useEffect(() => {
    // TODO: fetch match by ID — add GET /matches/:id endpoint
  }, [matchId])

  return (
    <main style={{ paddingTop: 80, padding: '80px var(--page-px) 48px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Match</h1>
        <Card>
          <p style={{ color: 'var(--ink-light)', fontSize: 14 }}>Match ID: {matchId}</p>
          <div className="divider" />
          <Button onClick={() => navigate(`/chat/${matchId}`)}>Open chat →</Button>
        </Card>
      </div>
    </main>
  )
}
