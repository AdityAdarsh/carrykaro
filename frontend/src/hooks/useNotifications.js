import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export function useNotifications(userId) {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [notifications, setNotifications] = useState([])
  const channelsRef = useRef([])

  useEffect(() => {
    if (!userId) return

    async function init() {
      try {
        const matches = await api.get('/matches/my')

        // Build match-event notifications from fetched data
        const notifs = []
        for (const m of matches) {
          if (localStorage.getItem(`notif_seen_${m.id}`)) continue

          const isMyRequest = m.requests?.user_id === userId
          const isMyTrip = m.trips?.user_id === userId
          const iInitiated = m.initiated_by === userId

          if (isMyRequest && !iInitiated && m.status !== 'declined') {
            notifs.push({
              type: 'new_match',
              matchId: m.id,
              route: `${m.requests?.from_city} → ${m.requests?.to_city}`,
              otherParty: m.trips?.users?.name || 'Someone',
              createdAt: m.created_at,
              text: `${m.trips?.users?.name || 'Someone'} wants to carry your ${m.requests?.from_city} → ${m.requests?.to_city} package`,
            })
          } else if (iInitiated && m.status === 'accepted') {
            notifs.push({
              type: 'match_accepted',
              matchId: m.id,
              route: `${m.requests?.from_city} → ${m.requests?.to_city}`,
              otherParty: m.requests?.users?.name || 'Sender',
              createdAt: m.created_at,
              text: `Your match on ${m.requests?.from_city} → ${m.requests?.to_city} was accepted`,
            })
          } else if (iInitiated && m.status === 'declined') {
            notifs.push({
              type: 'match_declined',
              matchId: m.id,
              route: `${m.requests?.from_city} → ${m.requests?.to_city}`,
              otherParty: m.requests?.users?.name || 'Sender',
              createdAt: m.created_at,
              text: `Your match on ${m.requests?.from_city} → ${m.requests?.to_city} was declined`,
            })
          }
        }
        setNotifications(notifs)

        // Subscribe to new messages in each match
        for (const m of matches) {
          const channel = supabase
            .channel(`notif_msgs_${m.id}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${m.id}` },
              (payload) => {
                if (payload.new.sender_id === userId) return
                if (window.location.pathname === `/chat/${m.id}`) return
                setUnreadMessages(n => n + 1)
              }
            )
            .subscribe()
          channelsRef.current.push(channel)
        }
      } catch {
        // Notifications are non-critical — fail silently
      }
    }

    init()

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [userId])

  const clearNotifications = () => {
    notifications.forEach(n => localStorage.setItem(`notif_seen_${n.matchId}`, '1'))
    setNotifications([])
  }

  const clearMessageUnread = () => setUnreadMessages(0)

  return { unreadMessages, notifications, clearNotifications, clearMessageUnread }
}
